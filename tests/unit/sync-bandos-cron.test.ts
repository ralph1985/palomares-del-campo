import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cronScript = readFileSync(
  new URL('../../scripts/sync-bandos-cron.sh', import.meta.url),
  'utf8',
);

describe('bandos cron validation order', () => {
  it('generates framework types before linting a fresh worktree', () => {
    const validationStart = cronScript.indexOf("PHASE='validación de la sincronización'");
    const dryRunCheck = cronScript.indexOf(
      'if [[ "${SYNC_BANDOS_DRY_RUN:-0}" == \'1\' ]]; then',
      validationStart,
    );
    const validationBlock = cronScript.slice(validationStart, dryRunCheck);
    const commands = [
      ...validationBlock.matchAll(/"\$PNPM_BIN" run (format:check|typecheck|lint|test|build)/g),
    ].map((match) => match[1]);

    expect(validationStart).toBeGreaterThanOrEqual(0);
    expect(dryRunCheck).toBeGreaterThan(validationStart);
    expect(commands).toEqual(['format:check', 'typecheck', 'lint', 'test', 'build']);
  });
});
