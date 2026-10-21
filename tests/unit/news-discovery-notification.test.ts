import { describe, expect, it, vi } from 'vitest';
import {
  buildNewsNotification,
  createNewsNodemailerSender,
  readNewsSmtpConfiguration,
  sendNewsNotification,
  type NewsMailSender,
  type NewsTransportFactory,
} from '../../scripts/news-discovery-notification.ts';

const pullRequest = {
  number: 42,
  url: 'https://github.com/ralph1985/palomares-del-campo/pull/42',
  branch: 'automation/news-discovery-2026-10-20',
  headSha: 'a'.repeat(40),
};
const articles = [
  {
    title: 'Una noticia <local> & próxima',
    sourceUrl: 'https://vocesdecuenca.com/palomares/noticia',
  },
];
const smtpEnvironment = {
  BANDOS_SMTP_HOST: 'smtp.example.test',
  BANDOS_SMTP_USER: 'user@example.test',
  BANDOS_SMTP_PASSWORD: 'synthetic-test-password',
  BANDOS_SMTP_PORT: '465',
  BANDOS_SMTP_SECURE: 'true',
  BANDOS_NOTIFY_FROM: 'web@example.test',
  BANDOS_NOTIFY_TO: 'editor@example.test',
};

describe('Palomares news PR notifications', () => {
  it('uses news-specific SMTP settings and falls back to bandos settings', () => {
    expect(readNewsSmtpConfiguration(smtpEnvironment)).toEqual({
      host: 'smtp.example.test',
      user: 'user@example.test',
      password: 'synthetic-test-password',
      from: 'web@example.test',
      to: 'editor@example.test',
      port: 465,
      secure: true,
    });
    expect(
      readNewsSmtpConfiguration({
        ...smtpEnvironment,
        NEWS_SMTP_HOST: 'news-smtp.example.test',
        NEWS_NOTIFY_TO: 'news-editor@example.test',
      }),
    ).toMatchObject({ host: 'news-smtp.example.test', to: 'news-editor@example.test' });
  });

  it('defaults the SMTP transport to port 587 and STARTTLS when no port is set', () => {
    const configuration = readNewsSmtpConfiguration({
      BANDOS_SMTP_HOST: 'smtp.example.test',
      BANDOS_SMTP_USER: 'user@example.test',
      BANDOS_SMTP_PASSWORD: 'synthetic-test-password',
      BANDOS_NOTIFY_FROM: 'web@example.test',
      BANDOS_NOTIFY_TO: 'editor@example.test',
    });

    expect(configuration.port).toBe(587);
    expect(configuration.secure).toBe(false);
  });

  it('includes a direct GitHub PR link and safely escapes article content', () => {
    const message = buildNewsNotification({ pullRequest, articles });

    expect(message.subject).toContain('noticia pendiente de revisión');
    expect(message.text).toContain(pullRequest.url);
    expect(message.html).toContain(`href="${pullRequest.url}"`);
    expect(message.html).toContain('Una noticia &lt;local&gt; &amp; próxima');
    expect(message.html).not.toContain('<local>');
  });

  it('uses plural wording and escapes every HTML-sensitive title character', () => {
    const message = buildNewsNotification({
      pullRequest,
      articles: [
        {
          title: `O'Brien & <alert> "local"`,
          sourceUrl: 'https://vocesdecuenca.com/palomares/noticia',
        },
        { title: 'Otra noticia local', sourceUrl: 'https://cuencanews.es/palomares/otra' },
      ],
    });

    expect(message.subject).toContain('noticias pendientes');
    expect(message.html).toContain('O&#39;Brien &amp; &lt;alert&gt; &quot;local&quot;');
  });

  it('sends the prepared message through the configured mail adapter', async () => {
    const sendMail = vi.fn<NewsMailSender>(async () => undefined);

    await sendNewsNotification({ pullRequest, articles }, smtpEnvironment, sendMail);

    expect(sendMail).toHaveBeenCalledOnce();
    const sentConfiguration = sendMail.mock.calls[0]?.[0];
    const sentMessage = sendMail.mock.calls[0]?.[1];
    expect(sentConfiguration?.host).toBe('smtp.example.test');
    expect(sentMessage?.to).toBe('editor@example.test');
    expect(sentMessage?.text).toContain(pullRequest.url);
  });

  it('configures Nodemailer for authenticated STARTTLS and sends the message', async () => {
    const sendMail = vi.fn(async () => undefined);
    const createTransport = vi.fn<NewsTransportFactory>(() => ({ sendMail }));
    const sender = createNewsNodemailerSender(createTransport);
    const smtp = readNewsSmtpConfiguration(smtpEnvironment);
    const message = buildNewsNotification({ pullRequest, articles });

    await sender(smtp, { ...message, from: smtp.from, to: smtp.to });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.test',
      port: 465,
      secure: true,
      requireTLS: true,
      auth: { user: 'user@example.test', pass: 'synthetic-test-password' },
    });
    expect(sendMail).toHaveBeenCalledWith({ ...message, from: smtp.from, to: smtp.to });
  });

  it('rejects missing SMTP settings and PR links outside this GitHub repository', async () => {
    expect(() => readNewsSmtpConfiguration({})).toThrow('BANDOS_SMTP_HOST');
    await expect(
      sendNewsNotification(
        {
          pullRequest: { ...pullRequest, url: 'https://evil.example/pull/42' },
          articles,
        },
        smtpEnvironment,
        vi.fn(async () => undefined),
      ),
    ).rejects.toThrow('La URL de la PR no pertenece al repositorio de Palomares');
    await expect(
      sendNewsNotification(
        { pullRequest: { ...pullRequest, url: 'not a URL' }, articles },
        smtpEnvironment,
        vi.fn<NewsMailSender>(async () => undefined),
      ),
    ).rejects.toThrow('La URL de la PR no pertenece al repositorio de Palomares');
  });

  it('rejects SMTP ports outside the TCP port range', () => {
    expect(() =>
      readNewsSmtpConfiguration({ ...smtpEnvironment, NEWS_SMTP_PORT: '70000' }),
    ).toThrow('debe ser un puerto válido');
  });
});
