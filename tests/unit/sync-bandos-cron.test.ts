import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const cronLauncher = readFileSync(
  new URL('../../scripts/sync-bandos-cron.sh', import.meta.url),
  'utf8',
);
const cronWorker = readFileSync(
  new URL('../../scripts/sync-bandos-cron-worker.sh', import.meta.url),
  'utf8',
);

describe('bandos cron validation order', () => {
  it('takes the common worktree lock before the worker can align main', () => {
    const branchGuardIndex = cronWorker.indexOf('branch --show-current');
    const alignmentIndex = cronWorker.indexOf('scripts/ensure-main-synced.ts');

    expect(cronLauncher).toContain('cron-worktree-lock.py');
    expect(cronLauncher).toContain('sync-bandos-cron-worker.sh');
    expect(branchGuardIndex).toBeGreaterThanOrEqual(0);
    expect(alignmentIndex).toBeGreaterThan(branchGuardIndex);
    expect(cronWorker).toContain('No se ejecuta fuera del worktree persistente de main');
  });

  it('always acquires the shared lock and has no TMPDIR-specific secondary lock', () => {
    expect(cronLauncher).toContain('cron-worktree-lock.py');
    expect(cronLauncher).not.toContain('PALOMARES_CRON_LOCK_FD');
    expect(cronWorker).toContain('cron-worktree-lock.py" --check');
    expect(cronWorker).not.toContain('palomares-del-campo-bandos.lock');
    expect(cronWorker).not.toContain('/usr/bin/flock -n 9');
  });

  it('fails closed from the interactive checkout without switching its branch or HEAD', () => {
    const projectRoot = path.resolve('.');
    const home = mkdtempSync(path.join(os.tmpdir(), 'bandos-main-guard-'));
    const environment: NodeJS.ProcessEnv = {
      HOME: home,
      TMPDIR: home,
      PATH: '/usr/bin:/bin',
      PYTHON_BIN: '/usr/bin/python3',
      PNPM_BIN: '/bin/true',
      NODE_BIN: '/bin/true',
      GH_BIN: '/bin/true',
      PALOMARES_CRON_LOCK_FD: '999',
    };
    const headBefore = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: environment,
    }).trim();

    try {
      const result = spawnSync(
        '/bin/bash',
        [path.join(projectRoot, 'scripts/sync-bandos-cron.sh')],
        {
          cwd: projectRoot,
          encoding: 'utf8',
          env: environment,
        },
      );
      expect(result.status).toBe(1);
      expect(`${result.stdout}${result.stderr}`).toContain(
        'No se ejecuta fuera del worktree persistente de main',
      );
      const lockPath = path.join(home, '.cache', 'palomares-del-campo', 'cron-worktree.lock');
      expect(existsSync(lockPath)).toBe(true);
      expect(statSync(lockPath).mode & 0o777).toBe(0o600);
      expect(
        execFileSync('git', ['rev-parse', 'HEAD'], {
          cwd: projectRoot,
          encoding: 'utf8',
          env: environment,
        }).trim(),
      ).toBe(headBefore);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('re-acquires the lock instead of trusting a forged descriptor when running the worker directly', () => {
    const projectRoot = path.resolve('.');
    const home = mkdtempSync(path.join(os.tmpdir(), 'bandos-worker-lock-'));
    const environment: NodeJS.ProcessEnv = {
      HOME: home,
      TMPDIR: home,
      PATH: '/usr/bin:/bin',
      PYTHON_BIN: '/usr/bin/python3',
      PNPM_BIN: '/bin/true',
      NODE_BIN: '/bin/true',
      GH_BIN: '/bin/true',
      PALOMARES_CRON_LOCK_FD: '999',
    };
    const headBefore = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: environment,
    }).trim();

    try {
      const result = spawnSync(
        '/bin/bash',
        [path.join(projectRoot, 'scripts/sync-bandos-cron-worker.sh')],
        { cwd: projectRoot, encoding: 'utf8', env: environment },
      );
      expect(result.status).toBe(1);
      expect(`${result.stdout}${result.stderr}`).toContain(
        'No se ejecuta fuera del worktree persistente de main',
      );
      const lockPath = path.join(home, '.cache', 'palomares-del-campo', 'cron-worktree.lock');
      expect(existsSync(lockPath)).toBe(true);
      expect(statSync(lockPath).mode & 0o777).toBe(0o600);
      expect(
        execFileSync('git', ['rev-parse', 'HEAD'], {
          cwd: projectRoot,
          encoding: 'utf8',
          env: environment,
        }).trim(),
      ).toBe(headBefore);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('rejects a separate clone even if it has the expected basename, branch and remote', () => {
    const sandbox = mkdtempSync(path.join(os.tmpdir(), 'bandos-wrong-repository-'));
    const home = path.join(sandbox, 'home');
    const fakeRoot = path.join(sandbox, 'palomares-del-campo-cron-main');
    const scriptsDirectory = path.join(fakeRoot, 'scripts');
    const marker = path.join(sandbox, 'pnpm-called');
    mkdirSync(home, { mode: 0o700 });
    mkdirSync(scriptsDirectory, { recursive: true });

    const workerSource = readFileSync(
      new URL('../../scripts/sync-bandos-cron-worker.sh', import.meta.url),
      'utf8',
    );
    const lockSource = readFileSync(
      new URL('../../scripts/cron-worktree-lock.py', import.meta.url),
      'utf8',
    );
    const workerPath = path.join(scriptsDirectory, 'sync-bandos-cron-worker.sh');
    writeFileSync(workerPath, workerSource, { mode: 0o755 });
    writeFileSync(path.join(scriptsDirectory, 'cron-worktree-lock.py'), lockSource, {
      mode: 0o755,
    });

    const gitEnvironment: NodeJS.ProcessEnv = { HOME: home, PATH: '/usr/bin:/bin' };
    const runGit = (args: string[]) =>
      execFileSync('git', args, { cwd: fakeRoot, encoding: 'utf8', env: gitEnvironment }).trim();
    runGit(['init', '--initial-branch=main']);
    runGit(['config', 'user.name', 'Cron guard test']);
    runGit(['config', 'user.email', 'cron-guard@example.invalid']);
    runGit(['config', 'commit.gpgsign', 'false']);
    runGit(['remote', 'add', 'origin', 'https://github.com/ralph1985/palomares-del-campo.git']);
    runGit(['add', 'scripts']);
    runGit(['commit', '-m', 'test fixture']);

    const fakePnpm = path.join(sandbox, 'pnpm');
    writeFileSync(fakePnpm, `#!/usr/bin/env bash\nprintf called > "${marker}"\nexit 73\n`, {
      mode: 0o755,
    });
    chmodSync(fakePnpm, 0o755);
    const workerEnvironment: NodeJS.ProcessEnv = {
      ...gitEnvironment,
      TMPDIR: home,
      PYTHON_BIN: '/usr/bin/python3',
      PNPM_BIN: fakePnpm,
      NODE_BIN: '/bin/true',
      GH_BIN: '/bin/true',
      PALOMARES_CRON_LOCK_FD: '999',
      PNPM_MARKER: marker,
    };

    try {
      const result = spawnSync('/bin/bash', [workerPath], {
        cwd: fakeRoot,
        encoding: 'utf8',
        env: workerEnvironment,
      });
      expect(result.status).toBe(1);
      expect(`${result.stdout}${result.stderr}`).toContain(
        'El worktree de cron no pertenece al repositorio principal esperado',
      );
      expect(existsSync(marker)).toBe(false);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('preserves dirty or locally committed temporary worktrees on failure', () => {
    const cleanupStart = cronWorker.indexOf('cleanup_worktree() {');
    const errorHandlerStart = cronWorker.indexOf('on_error() {', cleanupStart);
    const exitHandlerStart = cronWorker.indexOf('on_exit() {', errorHandlerStart);
    const cleanupBlock = cronWorker.slice(cleanupStart, errorHandlerStart);
    const errorHandlerBlock = cronWorker.slice(errorHandlerStart, exitHandlerStart);

    expect(cleanupStart).toBeGreaterThanOrEqual(0);
    expect(cleanupBlock).toContain('status --porcelain --untracked-files=all');
    expect(cleanupBlock).not.toContain('worktree remove --force');
    expect(cleanupBlock).toContain('se conserva');
    expect(errorHandlerBlock).toContain('WORKTREE_BRANCH');
    expect(errorHandlerBlock).toContain('PRESERVE_WORKTREE=1');
  });

  it('generates framework types before linting a fresh worktree', () => {
    const validationStart = cronWorker.indexOf("PHASE='validación de la sincronización'");
    const dryRunCheck = cronWorker.indexOf(
      'if [[ "${SYNC_BANDOS_DRY_RUN:-0}" == \'1\' ]]; then',
      validationStart,
    );
    const validationBlock = cronWorker.slice(validationStart, dryRunCheck);
    const commands = [
      ...validationBlock.matchAll(/"\$PNPM_BIN" run (format:check|typecheck|lint|test|build)/g),
    ].map((match) => match[1]);

    expect(validationStart).toBeGreaterThanOrEqual(0);
    expect(dryRunCheck).toBeGreaterThan(validationStart);
    expect(commands).toEqual(['format:check', 'typecheck', 'lint', 'test', 'build']);
  });

  it('guards against nested Bando paths before the direct-file allowlist', () => {
    const nestedRule = cronWorker.indexOf('src/content/bandos/*/*.md)');
    const directRule = cronWorker.indexOf('src/content/bandos/*.md|');

    expect(nestedRule).toBeGreaterThanOrEqual(0);
    expect(directRule).toBeGreaterThan(nestedRule);
    expect(cronWorker).toContain('Ruta anidada inesperada');
  });

  it('derives agenda after importing bandos and stages only the generated projection with source notices', () => {
    const fetchIndex = cronWorker.indexOf('"$PNPM_BIN" run fetch-bandos');
    const agendaIndex = cronWorker.indexOf('"$PNPM_BIN" run sync-agenda-from-bandos');
    const noChangeIndex = cronWorker.indexOf(
      'if\n    /usr/bin/git -C "$WORKTREE_DIR" diff --quiet',
      agendaIndex,
    );

    expect(fetchIndex).toBeGreaterThanOrEqual(0);
    expect(agendaIndex).toBeGreaterThan(fetchIndex);
    expect(noChangeIndex).toBeGreaterThan(agendaIndex);
    expect(cronWorker).toContain('src/content/bandos src/data/agenda-bandos.generated.ts');
    expect(cronWorker).toContain(
      '/usr/bin/git -C "$WORKTREE_DIR" add -- src/content/bandos src/data/agenda-bandos.generated.ts',
    );
    expect(cronWorker).toContain('src/content/bandos/*.md|src/data/agenda-bandos.generated.ts');
  });
});
