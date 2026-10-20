import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMainToDevelopBranchName,
  evaluateRequiredChecks,
  findOpenMainToDevelopPullRequest,
  mainToDevelopPullRequestTitle,
} from './bandos-sync-policy.ts';

type PromotionPullRequest = {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  url: string;
  state: string;
};

type CheckRun = {
  name: string;
  status?: string | null;
  conclusion?: string | null;
};

type PullRequestStatus = {
  state: string;
  baseRefName: string;
  headRefOid: string;
  mergeCommit?: { oid?: string | null } | null;
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = process.env.TMPDIR || os.tmpdir();
const checkAttempts = Number(process.env.BANDOS_CHECK_DISCOVERY_ATTEMPTS ?? '60');
const checkIntervalSeconds = Number(process.env.BANDOS_CHECK_DISCOVERY_INTERVAL_SECONDS ?? '10');
const promotionTitle = mainToDevelopPullRequestTitle;
let worktreePath = '';
let worktreeAdded = false;

function run(command: string, args: string[], cwd = projectRoot): string {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function isAncestor(ancestor: string, descendant: string, cwd = projectRoot): boolean {
  try {
    run('git', ['merge-base', '--is-ancestor', ancestor, descendant], cwd);
    return true;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'status' in error && error.status === 1) {
      return false;
    }
    throw error;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) record[key] = entry;
  return record;
}

function parsePromotionPullRequests(value: unknown): PromotionPullRequest[] {
  if (!Array.isArray(value)) throw new Error('GitHub devolvió una lista de PR no válida.');
  return value.flatMap((entry): PromotionPullRequest[] => {
    const item = asRecord(entry);
    if (
      !item ||
      typeof item.number !== 'number' ||
      typeof item.title !== 'string' ||
      typeof item.headRefName !== 'string' ||
      typeof item.baseRefName !== 'string' ||
      typeof item.url !== 'string' ||
      typeof item.state !== 'string'
    ) {
      throw new Error('GitHub devolvió una PR de promoción con campos no válidos.');
    }
    return [
      {
        number: item.number,
        title: item.title,
        headRefName: item.headRefName,
        baseRefName: item.baseRefName,
        url: item.url,
        state: item.state,
      },
    ];
  });
}

function parseRequiredContexts(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((context) => typeof context === 'string')) {
    throw new Error('GitHub devolvió una lista de checks obligatorios no válida.');
  }
  if (value.length === 0)
    throw new Error('develop no declara checks obligatorios; se cancela la fusión.');
  return value;
}

function parseCheckRuns(value: unknown): CheckRun[] {
  const payload = asRecord(value);
  if (!payload || !Array.isArray(payload.check_runs)) {
    throw new Error('GitHub devolvió una respuesta de checks no válida.');
  }
  return payload.check_runs.flatMap((entry): CheckRun[] => {
    const item = asRecord(entry);
    if (!item || typeof item.name !== 'string') return [];
    return [
      {
        name: item.name,
        status: typeof item.status === 'string' ? item.status : null,
        conclusion: typeof item.conclusion === 'string' ? item.conclusion : null,
      },
    ];
  });
}

function parsePullRequestStatus(value: unknown): PullRequestStatus {
  const item = asRecord(value);
  const mergeCommit = asRecord(item?.mergeCommit);
  if (
    !item ||
    typeof item.state !== 'string' ||
    typeof item.baseRefName !== 'string' ||
    typeof item.headRefOid !== 'string'
  ) {
    throw new Error('GitHub devolvió un estado de PR no válido.');
  }
  return {
    state: item.state,
    baseRefName: item.baseRefName,
    headRefOid: item.headRefOid,
    mergeCommit:
      mergeCommit && typeof mergeCommit.oid === 'string' ? { oid: mergeCommit.oid } : null,
  };
}

function readJson(command: string, args: string[]): unknown {
  return JSON.parse(run(command, args));
}

function waitForRequiredChecks(repository: string, pullRequestNumber: number): string {
  const requiredContexts = parseRequiredContexts(
    readJson('gh', [
      'api',
      `repos/${repository}/branches/develop/protection/required_status_checks/contexts`,
    ]),
  );
  const maxAttempts = Number.isInteger(checkAttempts) && checkAttempts > 0 ? checkAttempts : 60;
  const intervalSeconds =
    Number.isInteger(checkIntervalSeconds) && checkIntervalSeconds >= 0 ? checkIntervalSeconds : 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const status = parsePullRequestStatus(
      readJson('gh', [
        'pr',
        'view',
        String(pullRequestNumber),
        '--json',
        'state,baseRefName,headRefOid',
      ]),
    );
    if (status.state.toUpperCase() !== 'OPEN' || status.baseRefName !== 'develop') {
      throw new Error(`La PR #${pullRequestNumber} dejó de estar abierta contra develop.`);
    }

    const checkRuns = parseCheckRuns(
      readJson('gh', [
        'api',
        `repos/${repository}/commits/${status.headRefOid}/check-runs?per_page=100`,
      ]),
    );
    const evaluation = evaluateRequiredChecks(requiredContexts, checkRuns);
    if (evaluation.failed.length > 0) {
      throw new Error(
        `Checks obligatorios fallidos para ${status.headRefOid}: ${evaluation.failed.join(', ')}.`,
      );
    }
    if (evaluation.missing.length === 0 && evaluation.pending.length === 0) {
      return status.headRefOid;
    }

    console.log(
      `Esperando Verify de develop para ${status.headRefOid}: intento ${attempt}/${maxAttempts}.`,
    );
    if (attempt < maxAttempts)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, intervalSeconds * 1000);
  }

  throw new Error(`Los checks de la PR #${pullRequestNumber} no terminaron dentro del plazo.`);
}

function removeWorktreeIfClean(): void {
  if (!worktreePath || !fs.existsSync(worktreePath)) return;
  if (!worktreeAdded) {
    fs.rmdirSync(worktreePath);
    worktreePath = '';
    return;
  }
  const status = run('git', ['status', '--porcelain', '--untracked-files=all'], worktreePath);
  if (status) {
    console.error(`El worktree temporal conserva cambios para diagnóstico: ${worktreePath}`);
    return;
  }
  run('git', ['worktree', 'remove', worktreePath]);
  worktreePath = '';
  worktreeAdded = false;
}

function promoteMainToDevelop(): void {
  run('git', [
    'fetch',
    'origin',
    '+refs/heads/main:refs/remotes/origin/main',
    '+refs/heads/develop:refs/remotes/origin/develop',
  ]);
  const mainSha = run('git', ['rev-parse', 'origin/main']);
  const developSha = run('git', ['rev-parse', 'origin/develop']);
  if (isAncestor(mainSha, developSha)) {
    console.log(`main ya está integrado en develop (${mainSha}).`);
    return;
  }

  const repository = run('gh', [
    'repo',
    'view',
    '--json',
    'nameWithOwner',
    '--jq',
    '.nameWithOwner',
  ]);
  const pullRequests = parsePromotionPullRequests(
    readJson('gh', [
      'pr',
      'list',
      '--state',
      'open',
      '--base',
      'develop',
      '--json',
      'number,title,headRefName,baseRefName,url,state',
      '--limit',
      '100',
    ]),
  );
  const openPullRequest = findOpenMainToDevelopPullRequest(pullRequests);
  const branchName = openPullRequest?.headRefName ?? buildMainToDevelopBranchName();
  const tempDirectory = fs.mkdtempSync(path.join(tempRoot, 'palomares-main-to-develop.'));
  fs.rmdirSync(tempDirectory);
  worktreePath = tempDirectory;

  if (openPullRequest) {
    run('git', ['fetch', 'origin', `+refs/heads/${branchName}:refs/remotes/origin/${branchName}`]);
    run('git', ['worktree', 'add', '--detach', worktreePath, `origin/${branchName}`]);
  } else {
    const existingRemoteBranch = run('git', [
      'ls-remote',
      '--heads',
      'origin',
      `refs/heads/${branchName}`,
    ]);
    if (existingRemoteBranch) {
      throw new Error(`La rama remota ${branchName} ya existe sin una PR de promoción abierta.`);
    }
    run('git', ['worktree', 'add', '--detach', worktreePath, 'origin/develop']);
  }
  worktreeAdded = true;

  run('git', ['merge', '--no-edit', 'origin/develop'], worktreePath);
  run('git', ['merge', '--no-edit', 'origin/main'], worktreePath);
  if (!isAncestor(mainSha, run('git', ['rev-parse', 'HEAD'], worktreePath), worktreePath)) {
    throw new Error('La rama temporal no contiene el SHA de origin/main que se pretende promover.');
  }

  run('git', ['push', 'origin', `HEAD:refs/heads/${branchName}`], worktreePath);
  let pullRequestNumber = openPullRequest?.number;
  let pullRequestUrl = openPullRequest?.url;
  if (!openPullRequest) {
    pullRequestUrl = run('gh', [
      'pr',
      'create',
      '--base',
      'develop',
      '--head',
      branchName,
      '--title',
      promotionTitle,
      '--body',
      [
        '## Sincronización automática de producción',
        '',
        'Integra `origin/main` en `develop` después de publicar actualizaciones de bandos.',
        'Esta PR se fusionará únicamente cuando los checks obligatorios de `develop` estén verdes.',
        '',
        '_Generada por `scripts/sync-main-to-develop.ts`._',
      ].join('\n'),
    ]);
    const match = pullRequestUrl.match(/\/(\d+)$/);
    if (!match?.[1])
      throw new Error(`No se pudo identificar el número de la PR: ${pullRequestUrl}`);
    pullRequestNumber = Number(match[1]);
    console.log(`PR de promoción creada: ${pullRequestUrl}`);
  } else {
    console.log(`PR de promoción existente actualizada: ${pullRequestUrl}`);
  }
  if (pullRequestNumber === undefined || !pullRequestUrl) {
    throw new Error('La PR de promoción no tiene número o URL.');
  }

  const readySha = waitForRequiredChecks(repository, pullRequestNumber);
  run('gh', ['pr', 'merge', String(pullRequestNumber), '--merge', '--delete-branch']);
  const merged = parsePullRequestStatus(
    readJson('gh', [
      'pr',
      'view',
      String(pullRequestNumber),
      '--json',
      'state,baseRefName,headRefOid,mergeCommit',
    ]),
  );
  const mergeSha = merged.mergeCommit?.oid;
  if (
    merged.state.toUpperCase() !== 'MERGED' ||
    merged.baseRefName !== 'develop' ||
    merged.headRefOid !== readySha ||
    !mergeSha
  ) {
    throw new Error(`GitHub no confirmó la fusión de la PR de promoción #${pullRequestNumber}.`);
  }

  run('git', [
    'fetch',
    'origin',
    '+refs/heads/main:refs/remotes/origin/main',
    '+refs/heads/develop:refs/remotes/origin/develop',
  ]);
  if (!isAncestor('origin/main', 'origin/develop')) {
    throw new Error('La PR se fusionó, pero origin/develop aún no contiene origin/main.');
  }
  console.log(`main integrado en develop mediante ${mergeSha}; PR ${pullRequestUrl}.`);
}

try {
  promoteMainToDevelop();
} finally {
  removeWorktreeIfClean();
}
