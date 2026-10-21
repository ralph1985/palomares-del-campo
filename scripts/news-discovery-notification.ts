import nodemailer from 'nodemailer';
import type { NewsCandidate } from './news-discovery-policy.ts';
import type { NewsPullRequest } from './news-discovery-workflow.ts';

export interface NewsSmtpConfiguration {
  host: string;
  user: string;
  password: string;
  from: string;
  to: string;
  port: number;
  secure: boolean;
}

export interface NewsNotificationMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type NewsMailSender = (
  configuration: NewsSmtpConfiguration,
  message: NewsNotificationMessage,
) => Promise<void>;

const hasText = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function readNewsSmtpConfiguration(environment: NodeJS.ProcessEnv): NewsSmtpConfiguration {
  const values = {
    host: environment.NEWS_SMTP_HOST || environment.BANDOS_SMTP_HOST,
    user: environment.NEWS_SMTP_USER || environment.BANDOS_SMTP_USER,
    password: environment.NEWS_SMTP_PASSWORD || environment.BANDOS_SMTP_PASSWORD,
    from: environment.NEWS_NOTIFY_FROM || environment.BANDOS_NOTIFY_FROM,
    to: environment.NEWS_NOTIFY_TO || environment.BANDOS_NOTIFY_TO,
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !hasText(value))
    .map(([key]) => {
      const environmentKeys: Record<string, string> = {
        host: 'NEWS_SMTP_HOST/BANDOS_SMTP_HOST',
        user: 'NEWS_SMTP_USER/BANDOS_SMTP_USER',
        password: 'NEWS_SMTP_PASSWORD/BANDOS_SMTP_PASSWORD',
        from: 'NEWS_NOTIFY_FROM/BANDOS_NOTIFY_FROM',
        to: 'NEWS_NOTIFY_TO/BANDOS_NOTIFY_TO',
      };
      return environmentKeys[key] ?? key;
    });
  if (missing.length > 0) {
    throw new Error(`Falta configuración SMTP de noticias: ${missing.join(', ')}`);
  }

  const portValue = environment.NEWS_SMTP_PORT || environment.BANDOS_SMTP_PORT || '587';
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('NEWS_SMTP_PORT/BANDOS_SMTP_PORT debe ser un puerto válido.');
  }

  return {
    host: values.host ?? '',
    user: values.user ?? '',
    password: values.password ?? '',
    from: values.from ?? '',
    to: values.to ?? '',
    port,
    secure: (environment.NEWS_SMTP_SECURE || environment.BANDOS_SMTP_SECURE) === 'true',
  };
}

export function escapeNewsEmailHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const assertPalomaresPullRequestUrl = (pullRequest: NewsPullRequest): void => {
  let url: URL;
  try {
    url = new URL(pullRequest.url);
  } catch {
    throw new Error('La URL de la PR no pertenece al repositorio de Palomares.');
  }
  const expectedPath = `/ralph1985/palomares-del-campo/pull/${pullRequest.number}`;
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'github.com' ||
    url.username ||
    url.password ||
    url.pathname !== expectedPath ||
    url.search ||
    url.hash
  ) {
    throw new Error('La URL de la PR no pertenece al repositorio de Palomares.');
  }
};

export function buildNewsNotification({
  pullRequest,
  articles,
}: {
  pullRequest: NewsPullRequest;
  articles: readonly Pick<NewsCandidate, 'title' | 'sourceUrl'>[];
}): NewsNotificationMessage {
  assertPalomaresPullRequestUrl(pullRequest);
  const count = articles.length;
  const label = count === 1 ? 'noticia pendiente' : 'noticias pendientes';
  const subject = `Palomares: ${count} ${label} de revisión en GitHub`;
  const list = articles
    .map((article) => `- ${article.title}\n  Fuente: ${article.sourceUrl}`)
    .join('\n');
  const text = [
    `Hay ${count} ${label} de PR para revisar.`,
    '',
    `PR #${pullRequest.number}: ${pullRequest.url}`,
    '',
    'Noticias propuestas:',
    list,
    '',
    'La PR no se fusiona automáticamente; el contenido espera revisión.',
  ].join('\n');
  const rows = articles
    .map(
      (article) =>
        `<li><strong>${escapeNewsEmailHtml(article.title)}</strong><br><a href="${escapeNewsEmailHtml(article.sourceUrl)}">Ver fuente</a></li>`,
    )
    .join('\n');
  const html = `<!doctype html>
<html lang="es">
  <body style="font-family: Arial, sans-serif; color: #19342d;">
    <main>
      <h1>${count} ${escapeNewsEmailHtml(label)} para revisar</h1>
      <p>Hay una PR de noticias de Palomares pendiente de revisión.</p>
      <p><a href="${escapeNewsEmailHtml(pullRequest.url)}">Revisar PR #${pullRequest.number} en GitHub</a></p>
      <ul>${rows}</ul>
      <p>La PR no se fusiona automáticamente.</p>
    </main>
  </body>
</html>`;

  return { from: '', to: '', subject, text, html };
}

export interface NewsTransportOptions {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: true;
  auth: { user: string; pass: string };
}

export interface NewsMailTransport {
  sendMail(message: NewsNotificationMessage): Promise<unknown>;
}

export type NewsTransportFactory = (options: NewsTransportOptions) => NewsMailTransport;

const createNodemailerTransport: NewsTransportFactory = (options) => {
  const transporter = nodemailer.createTransport(options);
  return {
    sendMail: async (message) => {
      await transporter.sendMail(message);
    },
  };
};

export function createNewsNodemailerSender(
  createTransport: NewsTransportFactory = createNodemailerTransport,
): NewsMailSender {
  return async (configuration, message) => {
    const transporter = createTransport({
      host: configuration.host,
      port: configuration.port,
      secure: configuration.secure,
      requireTLS: true,
      auth: { user: configuration.user, pass: configuration.password },
    });
    await transporter.sendMail(message);
  };
}

const sendWithNodemailer = createNewsNodemailerSender();

export async function sendNewsNotification(
  notification: {
    pullRequest: NewsPullRequest;
    articles: readonly Pick<NewsCandidate, 'title' | 'sourceUrl'>[];
  },
  environment: NodeJS.ProcessEnv = process.env,
  sender: NewsMailSender = sendWithNodemailer,
): Promise<void> {
  const configuration = readNewsSmtpConfiguration(environment);
  const built = buildNewsNotification(notification);
  await sender(configuration, {
    ...built,
    from: configuration.from,
    to: configuration.to,
  });
}
