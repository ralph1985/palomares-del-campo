export const bandosPullRequestTitle = 'chore: actualizar bandos';

export function buildBandosBranchName(date = new Date()) {
  const timestamp = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
    .replace('T', '-')
    .replace('Z', '');

  return `chore/bandos-sync-${timestamp}`;
}

export function findOpenBandosPullRequest(pullRequests) {
  return (
    pullRequests.find(
      (pullRequest) =>
        String(pullRequest.state).toUpperCase() === 'OPEN' &&
        pullRequest.title === bandosPullRequestTitle,
    ) ?? null
  );
}

export function evaluateRequiredChecks(requiredContexts, checkRuns) {
  const latestByName = new Map();
  for (const checkRun of checkRuns ?? []) {
    latestByName.set(checkRun.name, checkRun);
  }

  const result = { missing: [], pending: [], failed: [] };
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

export function isAllowedBandoPath(filePath) {
  return /^src\/content\/bandos\/[^/]+\.md$/.test(filePath);
}
