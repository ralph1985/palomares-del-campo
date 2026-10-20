export const bandosPullRequestTitle = 'chore: actualizar bandos';
export const mainToDevelopPullRequestTitle = 'chore: integrar main en develop';

type BandosPullRequest = {
  number: number;
  title: string;
  headRefName: string;
  baseRefName?: string;
  url: string;
  state: string;
};

type CheckRun = {
  name: string;
  status?: string | null;
  conclusion?: string | null;
};

type RequiredChecksResult = {
  missing: string[];
  pending: string[];
  failed: string[];
};

export function buildBandosBranchName(date: Date = new Date()): string {
  const timestamp = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-')
    .replace('Z', '');

  return `chore/bandos-sync-${timestamp}`;
}

export function buildMainToDevelopBranchName(date: Date = new Date()): string {
  const timestamp = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-')
    .replace('Z', '');

  return `chore/main-to-develop-${timestamp}`;
}

export function findOpenBandosPullRequest(
  pullRequests: BandosPullRequest[],
): BandosPullRequest | null {
  return (
    pullRequests.find(
      (pullRequest) =>
        String(pullRequest.state).toUpperCase() === 'OPEN' &&
        pullRequest.title === bandosPullRequestTitle,
    ) ?? null
  );
}

export function findOpenMainToDevelopPullRequest(
  pullRequests: BandosPullRequest[],
): BandosPullRequest | null {
  return (
    pullRequests.find(
      (pullRequest) =>
        String(pullRequest.state).toUpperCase() === 'OPEN' &&
        pullRequest.title === mainToDevelopPullRequestTitle &&
        pullRequest.baseRefName === 'develop' &&
        /^chore\/main-to-develop-\d{8}-\d{6}$/.test(pullRequest.headRefName),
    ) ?? null
  );
}

export function evaluateRequiredChecks(
  requiredContexts: string[] | null | undefined,
  checkRuns: CheckRun[] | null | undefined,
): RequiredChecksResult {
  const latestByName = new Map<string, CheckRun>();
  for (const checkRun of checkRuns ?? []) {
    latestByName.set(checkRun.name, checkRun);
  }

  const result: RequiredChecksResult = { missing: [], pending: [], failed: [] };
  for (const context of requiredContexts ?? []) {
    const checkRun = latestByName.get(context);
    if (!checkRun) {
      result.missing.push(context);
    } else if (checkRun.status?.toUpperCase() !== 'COMPLETED') {
      result.pending.push(context);
    } else if (checkRun.conclusion?.toUpperCase() !== 'SUCCESS') {
      result.failed.push(context);
    }
  }

  return result;
}

export function isAllowedBandoPath(filePath: string): boolean {
  return /^src\/content\/bandos\/[^/]+\.md$/.test(filePath);
}
