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

  it('guards against nested Bando paths before the direct-file allowlist', () => {
    const nestedRule = cronScript.indexOf('src/content/bandos/*/*.md)');
    const directRule = cronScript.indexOf('src/content/bandos/*.md|');

    expect(nestedRule).toBeGreaterThanOrEqual(0);
    expect(directRule).toBeGreaterThan(nestedRule);
    expect(cronScript).toContain('Ruta anidada inesperada');
  });

  it('derives agenda after importing bandos and stages only the generated projection with source notices', () => {
    const fetchIndex = cronScript.indexOf('"$PNPM_BIN" run fetch-bandos');
    const agendaIndex = cronScript.indexOf('"$PNPM_BIN" run sync-agenda-from-bandos');
    const noChangeIndex = cronScript.indexOf(
      'if\n    /usr/bin/git -C "$WORKTREE_DIR" diff --quiet',
      agendaIndex,
    );

    expect(fetchIndex).toBeGreaterThanOrEqual(0);
    expect(agendaIndex).toBeGreaterThan(fetchIndex);
    expect(noChangeIndex).toBeGreaterThan(agendaIndex);
    expect(cronScript).toContain('src/content/bandos src/data/agenda-bandos.generated.ts');
    expect(cronScript).toContain(
      '/usr/bin/git -C "$WORKTREE_DIR" add -- src/content/bandos src/data/agenda-bandos.generated.ts',
    );
    expect(cronScript).toContain('src/content/bandos/*.md|src/data/agenda-bandos.generated.ts');
  });
});
