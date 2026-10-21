import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPrivateMainWorktreePaths } from '../../scripts/news-discovery-worktree.ts';

describe('private main worktree path allocation', () => {
  it('keeps the worktree target inside a private user-owned parent without pre-creating it', async () => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'news-worktree-home-'));

    try {
      const paths = await createPrivateMainWorktreePaths(home);

      expect(paths.parentDirectory).toContain(path.join(home, '.cache', 'palomares-del-campo'));
      expect(statSync(paths.parentDirectory).mode & 0o777).toBe(0o700);
      expect(existsSync(paths.worktreeDirectory)).toBe(false);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('rejects a group/world-writable cache parent before allocating a worktree', async () => {
    const home = mkdtempSync(path.join(os.tmpdir(), 'news-worktree-home-'));
    const cacheDirectory = path.join(home, '.cache');
    mkdirSync(cacheDirectory, { mode: 0o700 });
    chmodSync(cacheDirectory, 0o777);

    try {
      await expect(createPrivateMainWorktreePaths(home)).rejects.toThrow('writable by other users');
      expect(existsSync(path.join(cacheDirectory, 'palomares-del-campo'))).toBe(false);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
