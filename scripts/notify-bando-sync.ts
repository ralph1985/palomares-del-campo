import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import nodemailer from 'nodemailer';

const execFileAsync = promisify(execFile);

type NotificationBando = { title: string; url: string };
type NotificationContent = {
  commit: string;
  bandos: NotificationBando[];
  siteUrl: string;
};
type SmtpFields = {
  host: string;
  user: string;
  password: string;
  from: string;
  to: string;
};
type PartialSmtpFields = { [Key in keyof SmtpFields]: string | undefined };
type SmtpConfiguration = SmtpFields & { port: number; secure: boolean };

const hasSmtpFields = (fields: PartialSmtpFields): fields is SmtpFields =>
  Object.values(fields).every((value) => typeof value === 'string' && value.length > 0);

export function readSmtpConfiguration(environment: NodeJS.ProcessEnv): SmtpConfiguration {
  const fields: PartialSmtpFields = {
    host: environment.BANDOS_SMTP_HOST,
    user: environment.BANDOS_SMTP_USER,
    password: environment.BANDOS_SMTP_PASSWORD,
    from: environment.BANDOS_NOTIFY_FROM,
    to: environment.BANDOS_NOTIFY_TO,
  };

  if (!hasSmtpFields(fields)) {
    const missing = [
      ...(fields.host ? [] : ['BANDOS_SMTP_HOST']),
      ...(fields.user ? [] : ['BANDOS_SMTP_USER']),
      ...(fields.password ? [] : ['BANDOS_SMTP_PASSWORD']),
      ...(fields.from ? [] : ['BANDOS_NOTIFY_FROM']),
      ...(fields.to ? [] : ['BANDOS_NOTIFY_TO']),
    ];
    throw new Error(`Falta configuración SMTP: ${missing.join(', ')}`);
  }

  return {
    ...fields,
    port: Number(environment.BANDOS_SMTP_PORT ?? '587'),
    secure: environment.BANDOS_SMTP_SECURE === 'true',
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function parseBandoTitle(content: string, fallback: string): string {
  const match = content.match(/^title:\s+'(.*)'$/m);
  const title = match?.[1];
  return title === undefined ? fallback : title.replaceAll("''", "'");
}

export function getBandoTitle(filePath: string): string {
  return parseBandoTitle(
    fs.readFileSync(filePath, 'utf8'),
    path.basename(filePath, path.extname(filePath)),
  );
}

export function parseBandoSourceUrl(content: string): string {
  const match = content.match(/^sourceUrl:\s+'(.*)'$/m);
  const sourceUrl = match?.[1];
  return sourceUrl === undefined ? '' : sourceUrl.replaceAll("''", "'");
}

export function getBandoSourceUrl(filePath: string): string {
  return parseBandoSourceUrl(fs.readFileSync(filePath, 'utf8'));
}

export function buildBandoUrl(filePath: string, siteUrl: string): string {
  const slug = path.basename(filePath, path.extname(filePath));
  return new URL(`/bandos/${slug}/`, siteUrl).toString();
}

export function buildNotificationText({ commit, bandos, siteUrl }: NotificationContent): string {
  const label = bandos.length === 1 ? 'bando nuevo' : 'bandos nuevos';
  const list = bandos.map((bando) => `- ${bando.title}\n  ${bando.url}`).join('\n');
  const archiveLink = siteUrl ? `\n\nConsulta todos los bandos: ${siteUrl}/bandos/` : '';

  return `Se han publicado ${bandos.length} ${label} en la web de Palomares del Campo.\n\n${list}${archiveLink}\n\nActualización automática · Commit ${commit}`;
}

export function buildNotificationHtml({ commit, bandos, siteUrl }: NotificationContent): string {
  const label = bandos.length === 1 ? 'bando nuevo' : 'bandos nuevos';
  const rows = bandos
    .map(
      (bando) => `<li style="margin: 0 0 16px;">
  <a href="${escapeHtml(bando.url)}" style="color: #2f6652; font-weight: 700; text-decoration: none;">${escapeHtml(bando.title)}</a>
</li>`,
    )
    .join('\n');
  const archiveLink = siteUrl
    ? `<a href="${escapeHtml(`${siteUrl}/bandos/`)}" style="display: inline-block; padding: 12px 18px; background: #2f6652; border-radius: 6px; color: #fffdf8; font-weight: 700; text-decoration: none;">Ver todos los bandos</a>`
    : '';

  return `<!doctype html>
<html lang="es">
  <body style="margin: 0; padding: 24px; background: #f4f1e9; color: #19342d; font-family: Arial, sans-serif;">
    <main style="max-width: 600px; margin: 0 auto; background: #fffdf8; border-radius: 12px; overflow: hidden;">
      <header style="padding: 28px 32px; background: #19342d; color: #fffdf8;">
        <p style="margin: 0 0 8px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase;">Palomares del Campo</p>
        <h1 style="margin: 0; font-size: 26px; line-height: 1.2;">${bandos.length} ${label} publicado${bandos.length === 1 ? '' : 's'}</h1>
      </header>
      <section style="padding: 28px 32px;">
        <ul style="margin: 0 0 28px; padding-left: 20px; line-height: 1.5;">${rows}</ul>
        ${archiveLink}
      </section>
      <footer style="padding: 18px 32px; background: #e5b77e; color: #19342d; font-size: 13px; line-height: 1.5;">Actualización automática del RSS oficial · Commit ${escapeHtml(commit)}</footer>
    </main>
  </body>
</html>`;
}

export async function getChangedBandoFiles(commit: string): Promise<string[]> {
  const { stdout } = await execFileAsync('git', [
    'diff-tree',
    '--no-commit-id',
    '--name-only',
    '-r',
    `${commit}^1`,
    commit,
    '--',
    'src/content/bandos',
  ]);

  return stdout
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.endsWith('.md'));
}

export async function getChangedBandos(commit: string, siteUrl = ''): Promise<NotificationBando[]> {
  const files = await getChangedBandoFiles(commit);
  return files.map((file) => ({
    title: getBandoTitle(file),
    url: siteUrl ? buildBandoUrl(file, siteUrl) : getBandoSourceUrl(file),
  }));
}

export async function notifyBandoSync(
  commit: string,
): Promise<{ sent: true; skipped: false; count: number }> {
  const smtp = readSmtpConfiguration(process.env);
  const siteUrl = (process.env.BANDOS_SITE_URL ?? '').replace(/\/$/, '');
  const bandos = await getChangedBandos(commit, siteUrl);
  if (bandos.length === 0) {
    throw new Error(`El commit ${commit} no contiene cambios de bandos`);
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    requireTLS: true,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });

  await transporter.sendMail({
    from: smtp.from,
    to: smtp.to,
    subject: `Palomares: ${bandos.length} bando${bandos.length === 1 ? '' : 's'} publicado${bandos.length === 1 ? '' : 's'}`,
    text: buildNotificationText({ commit, bandos, siteUrl }),
    html: buildNotificationHtml({ commit, bandos, siteUrl }),
  });

  return { sent: true, skipped: false, count: bandos.length };
}

if (process.argv[1]?.endsWith('notify-bando-sync.ts')) {
  const commit = process.env.BANDOS_SYNC_COMMIT ?? process.argv[2];
  if (!commit) throw new Error('Provide BANDOS_SYNC_COMMIT or a commit SHA argument');
  const result = await notifyBandoSync(commit);
  console.log(result.sent ? `Notificación enviada para ${commit}.` : 'Notificación no enviada.');
}
