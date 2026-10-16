import { describe, expect, it } from 'vitest';
import {
  buildMainAlignmentCommands,
  parseMainDivergence,
} from '../../scripts/ensure-main-synced.ts';

describe('main divergence parsing', () => {
  it('parses both counts returned by git', () => {
    expect(parseMainDivergence('2\t3')).toEqual({ ahead: 2, behind: 3 });
  });

  it('rejects missing or invalid divergence counts', () => {
    expect(() => parseMainDivergence('2')).toThrow('No se pudo interpretar la divergencia de main');
    expect(() => parseMainDivergence('0 invalid')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
  });

  it('rejects zero-padded divergence counts', () => {
    expect(() => parseMainDivergence('000 1')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
    expect(() => parseMainDivergence('0 01')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
  });

  it('rejects counts outside the safe integer range', () => {
    expect(() => parseMainDivergence('9007199254740992 0')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
  });

  it('rejects negative counts, extra tokens, and whitespace-only output', () => {
    expect(() => parseMainDivergence('-1 0')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
    expect(() => parseMainDivergence('1 0 extra')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
    expect(() => parseMainDivergence('   ')).toThrow(
      'No se pudo interpretar la divergencia de main',
    );
  });
});

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
