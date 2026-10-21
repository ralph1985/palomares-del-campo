import { describe, expect, it } from 'vitest';
import {
  buildCodexArguments,
  buildCodexEnvironment,
  buildNewsSearchPrompt,
} from '../../scripts/news-discovery-prompt.ts';

const schemaPath = '/workspace/scripts/news-discovery.schema.json';
const projectRoot = '/workspace/project';

describe('news discovery Codex request', () => {
  it('asks only for recent, source-backed news directly relevant to Palomares', () => {
    const prompt = buildNewsSearchPrompt({
      today: '2026-10-20',
      lookbackDays: 30,
      existingNews: [
        {
          title: 'Noticia ya publicada',
          sourceUrl: 'https://vocesdecuenca.com/palomares/existing-story',
        },
      ],
    });

    expect(prompt).toContain('Palomares del Campo');
    expect(prompt).toContain('2026-10-20');
    expect(prompt).toContain('un total de 30 fechas');
    expect(prompt).toContain('29 días naturales anteriores (un total de 30 fechas)');
    expect(prompt).toContain('No incluyas bandos');
    expect(prompt).toContain('No incluyas enlaces dentro del texto');
    expect(prompt).toContain('vocesdecuenca.com');
    expect(prompt).toContain('Noticia ya publicada');
    expect(prompt).toContain('https://vocesdecuenca.com/palomares/existing-story');
  });

  it('runs Codex with live search enabled and a read-only sandbox', () => {
    const args = buildCodexArguments(projectRoot, schemaPath);

    expect(args).toEqual([
      '--search',
      '-a',
      'never',
      '-C',
      projectRoot,
      'exec',
      '--ignore-user-config',
      '--disable',
      'shell_tool',
      '--disable',
      'browser_use',
      '--disable',
      'browser_use_external',
      '--disable',
      'computer_use',
      '--disable',
      'code_mode_host',
      '--disable',
      'apps',
      '--ephemeral',
      '-s',
      'read-only',
      '--output-schema',
      schemaPath,
      '-',
    ]);
  });

  it('passes only the allowlisted runtime variables to Codex, not application credentials', () => {
    const environment = buildCodexEnvironment({
      PATH: '/usr/bin',
      HOME: '/home/rafa',
      CODEX_HOME: '/home/rafa/.codex',
      LANG: 'C.UTF-8',
      NEWS_SMTP_PASSWORD: 'fake-smtp-secret',
      GH_TOKEN: 'fake-github-token',
      OPENAI_API_KEY: 'fake-openai-key',
      HTTPS_PROXY: 'http://user:password@proxy.example',
    });

    expect(environment).toEqual({
      PATH: '/usr/bin',
      HOME: '/home/rafa',
      CODEX_HOME: '/home/rafa/.codex',
      LANG: 'C.UTF-8',
    });
  });

  it('states clearly when the repository has no existing news to deduplicate', () => {
    const prompt = buildNewsSearchPrompt({
      today: '2026-10-20',
      lookbackDays: 30,
      existingNews: [],
    });

    expect(prompt).toContain('No hay noticias anteriores disponibles.');
  });

  it('describes a one-date window as today only', () => {
    const prompt = buildNewsSearchPrompt({
      today: '2026-10-20',
      lookbackDays: 1,
      existingNews: [],
    });

    expect(prompt).toContain('publicadas solo hoy (un total de 1 fecha)');
  });
});
