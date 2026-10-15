import { describe, expect, it } from 'vitest';
import { buildMainAlignmentCommands } from '../../scripts/ensure-main-synced.ts';

describe('main alignment policy', () => {
  it('refuses to realign a dirty checkout', () => {
    expect(() =>
      buildMainAlignmentCommands({
        branch: 'main',
        status: ' M src/content/bandos/aviso.md',
        ahead: 0,
        behind: 0,
        backupBranch: 'backup/test',
      }),
    ).toThrow('árbol de trabajo no está limpio');
  });

  it('preserves local-ahead commits before resetting main', () => {
    expect(
      buildMainAlignmentCommands({
        branch: 'main',
        status: '',
        ahead: 2,
        behind: 1,
        backupBranch: 'backup/automation-main-divergence-test',
        fetched: true,
      }),
    ).toEqual([
      ['branch', 'backup/automation-main-divergence-test', 'main'],
      ['reset', '--hard', 'origin/main'],
    ]);
  });

  it('fetches and switches to main without resetting an aligned checkout', () => {
    expect(
      buildMainAlignmentCommands({
        branch: 'feature/test',
        status: '',
        ahead: 0,
        behind: 0,
        backupBranch: 'backup/unused',
      }),
    ).toEqual([
      ['switch', 'main'],
      ['fetch', 'origin', 'main'],
    ]);
  });
});
