import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildNotificationHtml,
  buildNotificationText,
  escapeHtml,
  getChangedBandoFiles,
  parseBandoSourceUrl,
  parseBandoTitle,
  readSmtpConfiguration,
} from '../../scripts/notify-bando-sync.ts';

describe('bando synchronization notification', () => {
  const bandos = [
    {
      title: 'Aviso <urgente>',
      url: 'https://example.com/bandos/123-aviso/',
    },
  ];

  it('escapes notification content and builds direct links', () => {
    expect(escapeHtml('A & B < C')).toBe('A &amp; B &lt; C');
    expect(
      buildNotificationText({
        commit: 'abc123',
        bandos,
        siteUrl: 'https://example.com',
      }),
    ).toContain('https://example.com/bandos/123-aviso/');

    const html = buildNotificationHtml({
      commit: 'abc123',
      bandos,
      siteUrl: 'https://example.com',
    });
    expect(html).toContain('Aviso &lt;urgente&gt;');
    expect(html).toContain('href="https://example.com/bandos/123-aviso/"');
    expect(html).toContain('Commit abc123');
  });

  it('parses optional frontmatter captures with safe fallbacks', () => {
    expect(parseBandoTitle("title: 'Aviso con ''cita'''", 'nombre-de-archivo')).toBe(
      "Aviso con 'cita'",
    );
    expect(parseBandoTitle('description: aviso', 'nombre-de-archivo')).toBe('nombre-de-archivo');
    expect(parseBandoSourceUrl("sourceUrl: 'https://example.com/a'")).toBe('https://example.com/a');
    expect(parseBandoSourceUrl('description: aviso')).toBe('');
  });

  it('narrows required SMTP settings and applies transport defaults', () => {
    expect(
      readSmtpConfiguration({
        BANDOS_SMTP_HOST: 'smtp.example.test',
        BANDOS_SMTP_USER: 'user@example.test',
        BANDOS_SMTP_PASSWORD: 'synthetic-test-password',
        BANDOS_NOTIFY_FROM: 'web@example.test',
        BANDOS_NOTIFY_TO: 'admin@example.test',
      }),
    ).toEqual({
      host: 'smtp.example.test',
      user: 'user@example.test',
      password: 'synthetic-test-password',
      from: 'web@example.test',
      to: 'admin@example.test',
      port: 587,
      secure: false,
    });
  });

  it('reports every missing SMTP variable without printing values', () => {
    expect(() => readSmtpConfiguration({ BANDOS_SMTP_HOST: 'smtp.example.test' })).toThrow(
      'BANDOS_SMTP_USER, BANDOS_SMTP_PASSWORD, BANDOS_NOTIFY_FROM, BANDOS_NOTIFY_TO',
    );
  });

  it('finds bandos introduced by a merge commit relative to its first parent', async () => {
    const originalWorkingDirectory = process.cwd();
    const repository = mkdtempSync(path.join(tmpdir(), 'bandos-notify-merge-'));
    const runGit = (args: string[]) =>
      execFileSync('git', args, {
        cwd: repository,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

    try {
      runGit(['init', '--initial-branch=main']);
      runGit(['config', 'user.name', 'Test']);
      runGit(['config', 'user.email', 'test@example.invalid']);
      runGit(['config', 'commit.gpgsign', 'false']);
      writeFileSync(path.join(repository, 'README.md'), 'base\n');
      runGit(['add', 'README.md']);
      runGit(['commit', '-m', 'base']);

      runGit(['switch', '-c', 'bandos']);
      const bandoPath = path.join(repository, 'src/content/bandos/123-aviso.md');
      mkdirSync(path.dirname(bandoPath), { recursive: true });
      writeFileSync(bandoPath, "title: 'Aviso de prueba'\n");
      runGit(['add', 'src/content/bandos/123-aviso.md']);
      runGit(['commit', '-m', 'add bando']);

      runGit(['switch', 'main']);
      runGit(['merge', '--no-ff', 'bandos', '-m', 'merge bandos']);
      const mergeCommit = runGit(['rev-parse', 'HEAD']);
      process.chdir(repository);

      await expect(getChangedBandoFiles(mergeCommit)).resolves.toEqual([
        'src/content/bandos/123-aviso.md',
      ]);
    } finally {
      process.chdir(originalWorkingDirectory);
      rmSync(repository, { recursive: true, force: true });
    }
  });
});
