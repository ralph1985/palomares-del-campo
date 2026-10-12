import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

function runGit(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error?.stderr?.toString().trim();
    throw new Error(stderr || error.message, { cause: error });
  }
}

export function buildMainAlignmentCommands({
  branch,
  status,
  ahead,
  behind,
  backupBranch,
  fetched = false,
}) {
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

function getDivergence(cwd) {
  const output = runGit(['rev-list', '--left-right', '--count', 'main...origin/main'], cwd);
  const [ahead, behind] = output.split(/\s+/).map(Number);
  if (!Number.isInteger(ahead) || !Number.isInteger(behind)) {
    throw new Error(`No se pudo interpretar la divergencia de main: ${output}`);
  }
  return { ahead, behind };
}

function uniqueBackupBranch(cwd, now = new Date()) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
  const prefix = `backup/automation-main-divergence-${stamp}-${process.pid}`;
  let candidate = prefix;
  let suffix = 2;
  const branchExists = (name) => {
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

export function ensureMainSynced({ cwd = process.cwd(), now = new Date() } = {}) {
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
