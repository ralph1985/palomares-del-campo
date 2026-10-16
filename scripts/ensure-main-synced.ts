import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

type MainAlignmentOptions = {
  branch: string;
  status: string;
  ahead: number;
  behind: number;
  backupBranch: string;
  fetched?: boolean;
};

type Divergence = { ahead: number; behind: number };
type AlignmentResult = { aligned: true; backupBranch: string };

function runGit(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error: unknown) {
    const stderr =
      error instanceof Error && 'stderr' in error ? String(error.stderr ?? '').trim() : '';
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(stderr || message, { cause: error });
  }
}

export function buildMainAlignmentCommands({
  branch,
  status,
  ahead,
  behind,
  backupBranch,
  fetched = false,
}: MainAlignmentOptions): string[][] {
  if (status.trim()) {
    throw new Error('El árbol de trabajo no está limpio; se cancela la alineación de main.');
  }

  const commands = [];
  if (branch !== 'main') commands.push(['switch', 'main']);
  if (!fetched) commands.push(['fetch', 'origin', 'main']);

  if (ahead === 0 && behind === 0) return commands;
  if (ahead > 0) commands.push(['branch', backupBranch, 'main']);
  commands.push(['reset', '--hard', 'origin/main']);
  return commands;
}

export function parseMainDivergence(output: string): Divergence {
  const counts = output.trim().split(/\s+/);
  const aheadText = counts[0];
  const behindText = counts[1];
  if (
    counts.length !== 2 ||
    aheadText === undefined ||
    behindText === undefined ||
    !/^(?:0|[1-9]\d*)$/.test(aheadText) ||
    !/^(?:0|[1-9]\d*)$/.test(behindText)
  ) {
    throw new Error(`No se pudo interpretar la divergencia de main: ${output}`);
  }

  const ahead = Number(aheadText);
  const behind = Number(behindText);
  if (!Number.isSafeInteger(ahead) || !Number.isSafeInteger(behind)) {
    throw new Error(`No se pudo interpretar la divergencia de main: ${output}`);
  }

  return { ahead, behind };
}

function getDivergence(cwd: string): Divergence {
  const output = runGit(['rev-list', '--left-right', '--count', 'main...origin/main'], cwd);
  return parseMainDivergence(output);
}

function uniqueBackupBranch(cwd: string, now: Date = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
  const prefix = `backup/automation-main-divergence-${stamp}-${process.pid}`;
  let candidate = prefix;
  let suffix = 2;
  const branchExists = (name: string): boolean => {
    try {
      runGit(['show-ref', '--verify', '--quiet', `refs/heads/${name}`], cwd);
      return true;
    } catch {
      return false;
    }
  };
  while (branchExists(candidate)) {
    candidate = `${prefix}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function ensureMainSynced({
  cwd = process.cwd(),
  now = new Date(),
}: { cwd?: string; now?: Date } = {}): AlignmentResult {
  const branch = runGit(['branch', '--show-current'], cwd);
  const status = runGit(['status', '--porcelain'], cwd);
  const initialCommands = buildMainAlignmentCommands({
    branch,
    status,
    ahead: 0,
    behind: 0,
    backupBranch: 'backup/unused',
  });

  for (const command of initialCommands) runGit(command, cwd);

  const divergence = getDivergence(cwd);
  if (divergence.ahead === 0 && divergence.behind === 0) {
    return { aligned: true, backupBranch: '' };
  }

  const backupBranch = divergence.ahead > 0 ? uniqueBackupBranch(cwd, now) : '';
  const alignmentCommands = buildMainAlignmentCommands({
    branch: 'main',
    status: runGit(['status', '--porcelain'], cwd),
    ...divergence,
    backupBranch,
    fetched: true,
  });
  for (const command of alignmentCommands) runGit(command, cwd);

  const finalDivergence = getDivergence(cwd);
  if (finalDivergence.ahead !== 0 || finalDivergence.behind !== 0) {
    throw new Error('main sigue desalineada después de sincronizarla.');
  }

  return { aligned: true, backupBranch };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = ensureMainSynced();
    if (result.backupBranch) {
      console.log(`Divergencia local conservada en ${result.backupBranch}.`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
