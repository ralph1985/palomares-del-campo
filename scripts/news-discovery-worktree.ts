import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface PrivateMainWorktreePaths {
  parentDirectory: string;
  worktreeDirectory: string;
}

const assertOwnedDirectory = async (directory: string, uid: number): Promise<void> => {
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== uid) {
    throw new Error(
      `Temporary worktree parent is not a trusted user-owned directory: ${directory}`,
    );
  }
  if ((info.mode & 0o022) !== 0) {
    throw new Error(`Temporary worktree parent is writable by other users: ${directory}`);
  }
};

const createDirectoryIfMissing = async (directory: string): Promise<void> => {
  try {
    await fs.mkdir(directory, { mode: 0o700 });
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
  }
};

export async function createPrivateMainWorktreePaths(
  homeDirectory = os.homedir(),
): Promise<PrivateMainWorktreePaths> {
  if (typeof process.getuid !== 'function') {
    throw new Error('Cannot verify the current user for a private temporary worktree.');
  }
  const uid = process.getuid();
  const home = await fs.realpath(homeDirectory);
  await assertOwnedDirectory(home, uid);

  const cacheDirectory = path.join(home, '.cache');
  await createDirectoryIfMissing(cacheDirectory);
  await assertOwnedDirectory(cacheDirectory, uid);

  const appCacheDirectory = path.join(cacheDirectory, 'palomares-del-campo');
  await createDirectoryIfMissing(appCacheDirectory);
  await assertOwnedDirectory(appCacheDirectory, uid);
  await fs.chmod(appCacheDirectory, 0o700);

  const worktreeRoot = path.join(appCacheDirectory, 'worktrees');
  await createDirectoryIfMissing(worktreeRoot);
  await assertOwnedDirectory(worktreeRoot, uid);
  await fs.chmod(worktreeRoot, 0o700);

  const parentDirectory = await fs.mkdtemp(path.join(worktreeRoot, 'news-'));
  await assertOwnedDirectory(parentDirectory, uid);
  await fs.chmod(parentDirectory, 0o700);

  const worktreeDirectory = path.join(parentDirectory, 'main');
  try {
    await fs.lstat(worktreeDirectory);
    throw new Error('Private temporary worktree target already exists.');
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      await fs.rmdir(parentDirectory);
      throw error;
    }
  }

  return { parentDirectory, worktreeDirectory };
}
