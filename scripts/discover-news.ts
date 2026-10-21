import dotenv from 'dotenv';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { readNewsSmtpConfiguration, sendNewsNotification } from './news-discovery-notification.ts';
import { type ExistingNewsReference, type NewsCandidate } from './news-discovery-policy.ts';
import {
  runNewsDiscoveryWorkflow,
  type NewsPullRequest,
  type RenderedNewsArticle,
} from './news-discovery-workflow.ts';
import {
  buildCodexArguments,
  buildCodexEnvironment,
  buildNewsSearchPrompt,
} from './news-discovery-prompt.ts';
import {
  buildOpenNewsPullRequestArgs,
  buildNewsPullRequestBody,
  parseOpenNewsPullRequests,
} from './news-discovery-github.ts';
import {
  createPrivateMainWorktreePaths,
  type PrivateMainWorktreePaths,
} from './news-discovery-worktree.ts';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const newsDirectory = 'src/content/noticias';
const automationBranchPrefix = 'automation/news-discovery-';
const maximumOutputBytes = 1_000_000;

type ExistingArticle = ExistingNewsReference;

function parseFrontmatterString(frontmatter: string, key: string): string | undefined {
  const line = frontmatter.split(/\r?\n/).find((entry) => entry.startsWith(`${key}:`));
  if (!line) return undefined;
  const value = line.slice(key.length + 1).trim();
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'string' ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) return undefined;
    return value.slice(1, -1).replaceAll("''", "'");
  }
  return value.length > 0 ? value : undefined;
}

function readArticleMetadata(content: string): ExistingArticle | undefined {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return undefined;
  const closingIndex = content.indexOf('\n---', 4);
  if (closingIndex < 0) return undefined;
  const frontmatter = content.slice(4, closingIndex);
  const title = parseFrontmatterString(frontmatter, 'title');
  const sourceUrl = parseFrontmatterString(frontmatter, 'sourceUrl');
  if (!title || !sourceUrl) return undefined;
  return { title, sourceUrl };
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listMarkdownFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath);
  }
  return files;
}

async function readExistingNews(workspace: string): Promise<ExistingNewsReference[]> {
  const directory = path.join(workspace, newsDirectory);
  const paths = await listMarkdownFiles(directory);
  const articles: ExistingNewsReference[] = [];
  for (const filePath of paths) {
    const content = await fs.readFile(filePath, 'utf8');
    const metadata = readArticleMetadata(content);
    if (metadata) articles.push(metadata);
  }
  return articles;
}

async function runCommand(
  binary: string,
  args: string[],
  cwd: string,
  phase: string,
): Promise<string> {
  try {
    const result = await execFileAsync(binary, args, {
      cwd,
      env: process.env,
      encoding: 'utf8',
      maxBuffer: maximumOutputBytes,
    });
    return result.stdout.trim();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.replace(/\s+/g, ' ').slice(0, 300)
        : 'fallo desconocido';
    throw new Error(`${phase}: ${message}`, { cause: error });
  }
}

async function runCodexSearch(
  workspace: string,
  prompt: string,
  schemaPath: string,
): Promise<unknown> {
  const executable = process.env.NEWS_CODEX_BIN || 'codex';
  const timeoutMs = Number(process.env.NEWS_CODEX_TIMEOUT_MS || '300000');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) {
    throw new Error('NEWS_CODEX_TIMEOUT_MS debe estar entre 1000 y 600000 milisegundos.');
  }

  return new Promise((resolve, reject) => {
    const child = spawn(executable, buildCodexArguments(workspace, schemaPath), {
      cwd: workspace,
      env: buildCodexEnvironment(process.env),
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    let stdout = '';
    let timedOut = false;
    let outputTooLarge = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout, 'utf8') > maximumOutputBytes) {
        outputTooLarge = true;
        child.kill('SIGTERM');
      }
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`No se pudo ejecutar Codex: ${error.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error('La búsqueda de noticias agotó el tiempo límite de Codex.'));
        return;
      }
      if (outputTooLarge) {
        reject(new Error('Codex devolvió una respuesta superior al límite permitido.'));
        return;
      }
      if (code !== 0) {
        reject(new Error(`Codex terminó con código ${String(code)}.`));
        return;
      }
      try {
        const parsed: unknown = JSON.parse(stdout);
        resolve(parsed);
      } catch {
        reject(new Error('Codex no devolvió JSON válido según el esquema de noticias.'));
      }
    });
    child.stdin.on('error', () => undefined);
    child.stdin.end(prompt);
  });
}

async function createMainWorktree(): Promise<PrivateMainWorktreePaths> {
  const paths = await createPrivateMainWorktreePaths();
  try {
    await runCommand(
      'git',
      ['worktree', 'add', '--detach', paths.worktreeDirectory, 'origin/main'],
      projectRoot,
      'Preparación del worktree de main',
    );
  } catch (error) {
    await fs.rm(paths.parentDirectory, { recursive: true, force: true });
    throw error;
  }
  return paths;
}

async function removeMainWorktree(worktree: PrivateMainWorktreePaths): Promise<void> {
  const directory = worktree.worktreeDirectory;
  const status = await runCommand(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    directory,
    'Comprobación del worktree temporal',
  );
  if (status) {
    console.error(
      `Worktree temporal conservado para inspección porque contiene cambios: ${directory}`,
    );
    return;
  }
  await runCommand(
    'git',
    ['worktree', 'remove', directory],
    projectRoot,
    'Retirada del worktree temporal',
  );
  await fs.rmdir(worktree.parentDirectory);
}

function madridStamp(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}-${values.get('hour')}${values.get('minute')}${values.get('second')}`;
}

async function assertNoOpenNewsPullRequest(): Promise<void> {
  const output = await runCommand(
    'gh',
    buildOpenNewsPullRequestArgs(),
    projectRoot,
    'Consulta de PRs pendientes',
  );
  let response: unknown;
  try {
    response = JSON.parse(output);
  } catch {
    throw new Error('GitHub devolvió una lista paginada de PR no válida.');
  }
  const openNewsPrs = parseOpenNewsPullRequests(response).filter((pr) =>
    pr.headRefName.startsWith(automationBranchPrefix),
  );
  if (openNewsPrs.length > 0) {
    const links = openNewsPrs.map((pr) => `#${pr.number}: ${pr.url}`).join(', ');
    throw new Error(
      `Ya hay noticias pendientes de revisión (${links}); no se creará otra PR hasta resolverla.`,
    );
  }
}

async function createContentPullRequest(
  articles: readonly RenderedNewsArticle[],
  candidates: readonly NewsCandidate[],
  workspace: string,
): Promise<NewsPullRequest> {
  const branch = `${automationBranchPrefix}${madridStamp()}`;
  await runCommand('git', ['switch', '-c', branch], workspace, 'Creación de la rama de noticias');
  const newsRoot = path.resolve(workspace, newsDirectory);
  for (const article of articles) {
    const filePath = path.resolve(newsRoot, article.filename);
    if (!filePath.startsWith(`${newsRoot}${path.sep}`)) {
      throw new Error('La ruta de una noticia sale de la colección permitida.');
    }
    try {
      await fs.access(filePath);
      throw new Error(`Ya existe un archivo con el slug ${article.filename}.`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Ya existe')) throw error;
    }
    await fs.writeFile(filePath, article.content, { flag: 'wx' });
  }

  const relativePaths = articles.map((article) => path.posix.join(newsDirectory, article.filename));
  await runCommand(
    'pnpm',
    ['install', '--frozen-lockfile', '--prefer-offline'],
    workspace,
    'Instalación de dependencias',
  );
  await runCommand(
    'pnpm',
    ['exec', 'prettier', '--write', ...relativePaths],
    workspace,
    'Formato de las noticias generadas',
  );
  await runCommand('pnpm', ['run', 'format:check'], workspace, 'Comprobación de formato');
  await runCommand('pnpm', ['run', 'typecheck'], workspace, 'Typecheck');
  await runCommand('pnpm', ['run', 'lint'], workspace, 'Lint');
  await runCommand('pnpm', ['run', 'test'], workspace, 'Pruebas unitarias');
  await runCommand('pnpm', ['run', 'build'], workspace, 'Build de Astro');
  await runCommand('pnpm', ['run', 'check:seo'], workspace, 'Comprobación SEO');
  await runCommand(
    'git',
    ['add', '--', ...relativePaths],
    workspace,
    'Preparación de archivos de noticias',
  );
  await runCommand('git', ['diff', '--cached', '--check'], workspace, 'Comprobación del diff');
  const staged = await runCommand(
    'git',
    ['diff', '--cached', '--name-only'],
    workspace,
    'Verificación de archivos preparados',
  );
  const stagedPaths = staged.split('\n').filter(Boolean);
  if (
    stagedPaths.length !== articles.length ||
    stagedPaths.some((file) => !file.startsWith(`${newsDirectory}/`))
  ) {
    throw new Error('La PR incluiría archivos fuera de la colección de noticias.');
  }
  await runCommand(
    'git',
    ['commit', '-m', `feat(noticias): propuestas editoriales ${madridStamp().slice(0, 10)}`],
    workspace,
    'Commit de las noticias',
  );
  await runCommand(
    'git',
    ['push', '--set-upstream', 'origin', branch],
    workspace,
    'Publicación de la rama de noticias',
  );

  const body = buildNewsPullRequestBody(candidates);
  const prUrl = await runCommand(
    'gh',
    [
      'pr',
      'create',
      '--base',
      'main',
      '--head',
      branch,
      '--title',
      'feat(noticias): propuestas locales para revisar',
      '--body',
      body,
    ],
    workspace,
    'Creación de la PR de noticias',
  );
  const prNumber = Number(new URL(prUrl).pathname.split('/').at(-1));
  if (!Number.isInteger(prNumber) || prNumber < 1)
    throw new Error('GitHub no devolvió una URL de PR válida.');
  const details = await runCommand(
    'gh',
    [
      'pr',
      'view',
      String(prNumber),
      '--json',
      'number,url,state,baseRefName,headRefName,headRefOid',
    ],
    workspace,
    'Verificación de la PR creada',
  );
  let value: unknown;
  try {
    value = JSON.parse(details);
  } catch {
    throw new Error('GitHub no devolvió los detalles de la PR en formato JSON.');
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    !('number' in value) ||
    value.number !== prNumber ||
    !('url' in value) ||
    value.url !== prUrl ||
    !('state' in value) ||
    value.state !== 'OPEN' ||
    !('baseRefName' in value) ||
    value.baseRefName !== 'main' ||
    !('headRefName' in value) ||
    value.headRefName !== branch ||
    !('headRefOid' in value) ||
    typeof value.headRefOid !== 'string'
  ) {
    throw new Error(`La PR creada no coincide con el destino esperado: ${prUrl}`);
  }
  return { number: prNumber, url: prUrl, branch, headSha: value.headRefOid };
}

async function assertPublishConfiguration(): Promise<void> {
  readNewsSmtpConfiguration(process.env);
  await runCommand(
    'gh',
    ['auth', 'status', '--hostname', 'github.com'],
    projectRoot,
    'Autenticación de GitHub',
  );
  await runCommand('git', ['fetch', 'origin', 'main'], projectRoot, 'Actualización de origin/main');
  await assertNoOpenNewsPullRequest();
}

function getMadridDate(now = new Date()): string {
  return madridStamp(now).slice(0, 10);
}

async function loadEnvFiles(): Promise<void> {
  dotenv.config({ path: path.join(projectRoot, '.env.local'), quiet: true });
  dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });
}

async function main(): Promise<void> {
  await loadEnvFiles();
  const dryRun = process.argv.includes('--dry-run') || process.env.NEWS_DRY_RUN === '1';
  const lookbackDays = 30;

  let workspace = projectRoot;
  let temporaryWorktree: PrivateMainWorktreePaths | undefined;
  const schemaPath = path.join(projectRoot, 'scripts', 'news-discovery.schema.json');
  const dependencies = {
    assertCanPublish: async () => {
      await assertPublishConfiguration();
      temporaryWorktree = await createMainWorktree();
      workspace = temporaryWorktree.worktreeDirectory;
    },
    getExistingNews: () => readExistingNews(workspace),
    discover: (existingNews: readonly ExistingNewsReference[]) =>
      runCodexSearch(
        workspace,
        buildNewsSearchPrompt({ today: getMadridDate(), lookbackDays, existingNews }),
        schemaPath,
      ),
    createPullRequest: (
      articles: readonly RenderedNewsArticle[],
      candidates: readonly NewsCandidate[],
    ) => createContentPullRequest(articles, candidates, workspace),
    sendNotification: (pullRequest: NewsPullRequest, candidates: readonly NewsCandidate[]) =>
      sendNewsNotification({ pullRequest, articles: candidates }),
  };

  try {
    const result = await runNewsDiscoveryWorkflow(
      { dryRun, lookbackDays, today: getMadridDate() },
      dependencies,
    );
    if (result.status === 'dry-run') {
      console.log(
        `Dry run: ${result.articles.length} propuestas válidas; ${result.rejected.length} descartadas. No se han creado archivos, ramas, PR ni correos.`,
      );
      for (const article of result.articles)
        console.log(`- ${article.title} — ${article.sourceUrl}`);
    } else if (result.status === 'no-news') {
      console.log(
        `No se encontraron noticias nuevas válidas. ${result.rejected.length} candidatas descartadas.`,
      );
    } else if (result.pullRequest) {
      console.log(
        `PR de noticias creada y verificada: ${result.pullRequest.url}. Aviso enviado por correo.`,
      );
    }
  } finally {
    if (temporaryWorktree) await removeMainWorktree(temporaryWorktree);
  }
}

const invokedScript = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedScript === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message.replace(/\s+/g, ' ').slice(0, 500)
        : 'fallo desconocido';
    console.error(`News discovery failed: ${message}`);
    process.exitCode = 1;
  });
}
