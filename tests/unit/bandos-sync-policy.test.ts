import { describe, expect, it } from 'vitest';
import {
  buildBandosBranchName,
  evaluateRequiredChecks,
  findOpenBandosPullRequest,
  isAllowedBandoPath,
} from '../../scripts/bandos-sync-policy.ts';

const pullRequest = {
  number: 12,
  title: 'chore: actualizar bandos',
  headRefName: 'chore/bandos-sync-20261012-100000',
  url: 'https://github.com/example/pull/12',
  state: 'OPEN',
};

describe('bandos sync policy', () => {
  it('builds a unique task branch name from UTC time', () => {
    expect(buildBandosBranchName(new Date('2026-10-12T10:00:00.000Z'))).toBe(
      'chore/bandos-sync-20261012-100000',
    );
  });

  it('finds an existing open synchronization pull request', () => {
    expect(findOpenBandosPullRequest([{ ...pullRequest, title: 'otra PR' }, pullRequest])).toEqual(
      pullRequest,
    );
    expect(findOpenBandosPullRequest([{ ...pullRequest, state: 'MERGED' }])).toBeNull();
  });

  it('limits generated changes to bando Markdown files', () => {
    expect(isAllowedBandoPath('src/content/bandos/123-aviso.md')).toBe(true);
    expect(isAllowedBandoPath('src/content/noticias/123-aviso.md')).toBe(false);
    expect(isAllowedBandoPath('src/content/bandos/../../.env')).toBe(false);
  });

  it('evaluates required checks as missing, pending, or failed', () => {
    expect(evaluateRequiredChecks(['quality'], [])).toEqual({
      missing: ['quality'],
      pending: [],
      failed: [],
    });
    expect(
      evaluateRequiredChecks(
        ['quality'],
        [{ name: 'quality', status: 'IN_PROGRESS', conclusion: '' }],
      ),
    ).toEqual({ missing: [], pending: ['quality'], failed: [] });
    expect(
      evaluateRequiredChecks(
        ['quality'],
        [{ name: 'quality', status: 'COMPLETED', conclusion: 'FAILURE' }],
      ),
    ).toEqual({ missing: [], pending: [], failed: ['quality'] });
    expect(
      evaluateRequiredChecks(
        ['quality'],
        [{ name: 'quality', status: 'COMPLETED', conclusion: 'SUCCESS' }],
      ),
    ).toEqual({ missing: [], pending: [], failed: [] });
  });
});
