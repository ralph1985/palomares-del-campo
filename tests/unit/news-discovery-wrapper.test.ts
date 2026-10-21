import { execFileSync, spawn } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const wrapperPath = path.resolve('scripts/run-news-discovery.sh');

function createHarness() {
  const home = mkdtempSync(path.join(os.tmpdir(), 'news-discovery-wrapper-'));
  const fakePnpm = path.join(home, 'pnpm');
  const marker = path.join(home, 'pnpm-ran.txt');
  writeFileSync(
    fakePnpm,
    '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$PNPM_MARKER"\nprintf "pnpm-ran:%s\\n" "$*"\n',
  );
  chmodSync(fakePnpm, 0o755);
  return { home, fakePnpm, marker };
}

function runWrapper(
  harness: ReturnType<typeof createHarness>,
  args: string[] = [],
  extraEnvironment: NodeJS.ProcessEnv = {},
): string {
  return execFileSync('bash', [wrapperPath, ...args], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: harness.home,
      PNPM_BIN: harness.fakePnpm,
      PNPM_MARKER: harness.marker,
      PYTHON_BIN: 'python3',
      TMPDIR: harness.home,
      ...extraEnvironment,
    },
  });
}

const sharedLockDirectory = (home: string): string =>
  path.join(home, '.cache', 'palomares-del-campo');

const sharedLockPath = (home: string): string =>
  path.join(sharedLockDirectory(home), 'cron-worktree.lock');

describe('news discovery command wrapper', () => {
  it('holds the common worktree lock for a dry-run too', () => {
    const harness = createHarness();

    try {
      expect(runWrapper(harness, ['--dry-run'])).toContain(
        'pnpm-ran:exec tsx scripts/discover-news.ts --dry-run',
      );
      expect(existsSync(sharedLockPath(harness.home))).toBe(true);
      expect(statSync(sharedLockPath(harness.home)).mode & 0o777).toBe(0o600);
    } finally {
      rmSync(harness.home, { recursive: true, force: true });
    }
  });

  it('refuses a symlink lock file without changing its target or starting pnpm', () => {
    const harness = createHarness();
    const target = path.join(harness.home, 'important.txt');
    mkdirSync(sharedLockDirectory(harness.home), { recursive: true, mode: 0o700 });
    writeFileSync(target, 'preserve me');
    symlinkSync(target, sharedLockPath(harness.home));

    try {
      expect(() => runWrapper(harness)).toThrow();
      expect(readFileSync(target, 'utf8')).toBe('preserve me');
      expect(existsSync(harness.marker)).toBe(false);
    } finally {
      rmSync(harness.home, { recursive: true, force: true });
    }
  });

  it('refuses a symlink lock directory without writing through it', () => {
    const harness = createHarness();
    const target = path.join(harness.home, 'outside');
    const cache = path.join(harness.home, '.cache');
    mkdirSync(target, { recursive: true });
    mkdirSync(cache, { recursive: true });
    writeFileSync(path.join(target, 'marker'), 'preserve me');
    symlinkSync(target, sharedLockDirectory(harness.home));

    try {
      expect(() => runWrapper(harness)).toThrow();
      expect(readFileSync(path.join(target, 'marker'), 'utf8')).toBe('preserve me');
      expect(existsSync(harness.marker)).toBe(false);
    } finally {
      rmSync(harness.home, { recursive: true, force: true });
    }
  });

  it('refuses a group- or world-writable cache parent', () => {
    const harness = createHarness();
    const cache = path.join(harness.home, '.cache');
    mkdirSync(cache, { recursive: true });
    chmodSync(cache, 0o777);

    try {
      expect(() => runWrapper(harness)).toThrow();
      expect(existsSync(harness.marker)).toBe(false);
    } finally {
      rmSync(harness.home, { recursive: true, force: true });
    }
  });

  it('refuses a writable lock directory rather than fixing it after the trust check', () => {
    const harness = createHarness();
    const lockDirectory = sharedLockDirectory(harness.home);
    mkdirSync(lockDirectory, { recursive: true, mode: 0o700 });
    chmodSync(lockDirectory, 0o777);

    try {
      expect(() => runWrapper(harness)).toThrow();
      expect(existsSync(harness.marker)).toBe(false);
      expect(statSync(lockDirectory).mode & 0o777).toBe(0o777);
    } finally {
      rmSync(harness.home, { recursive: true, force: true });
    }
  });

  it('runs the worker when the secure common lock is available and can be reacquired', () => {
    const harness = createHarness();

    try {
      expect(runWrapper(harness)).toContain('pnpm-ran:exec tsx scripts/discover-news.ts');
      expect(runWrapper(harness)).toContain('pnpm-ran:exec tsx scripts/discover-news.ts');
    } finally {
      rmSync(harness.home, { recursive: true, force: true });
    }
  });

  it('skips when another process owns the common worktree lock', async () => {
    const harness = createHarness();
    const lockDirectory = sharedLockDirectory(harness.home);
    mkdirSync(lockDirectory, { recursive: true, mode: 0o700 });
    const lockPath = sharedLockPath(harness.home);
    const readyPath = path.join(harness.home, 'holder-ready');
    const holderCode = [
      'import fcntl, os, pathlib, sys, time',
      'fd = os.open(sys.argv[1], os.O_CREAT | os.O_RDWR, 0o600)',
      'fcntl.flock(fd, fcntl.LOCK_EX)',
      'pathlib.Path(sys.argv[2]).write_text("ready")',
      'time.sleep(10)',
    ].join(';');
    const holder = spawn('python3', ['-c', holderCode, lockPath, readyPath], {
      stdio: 'ignore',
    });

    try {
      const deadline = Date.now() + 3000;
      while (!existsSync(readyPath) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(existsSync(readyPath)).toBe(true);
      const output = runWrapper(harness);
      expect(output).toContain('Ya hay una tarea de cron en marcha');
      expect(existsSync(harness.marker)).toBe(false);
    } finally {
      holder.kill('SIGTERM');
      await once(holder, 'exit');
      rmSync(harness.home, { recursive: true, force: true });
    }
  });
});
