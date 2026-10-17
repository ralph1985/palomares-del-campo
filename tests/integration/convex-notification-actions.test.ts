// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { internal } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = (
  import.meta as ImportMeta & {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob('../../convex/**/*.ts');

const validSubmission = {
  displayName: 'Ana López',
  city: 'Madrid',
  country: 'España',
  story: 'Vuelvo al pueblo siempre que puedo.',
  contactEmail: 'ana@example.com',
  consent: true,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Convex Palomareños notification actions', () => {
  it('sends a moderated-submission alert once and persists the provider receipt', async () => {
    const t = convexTest(schema, modules);
    const submitted = await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ id: 'resend-alert-1' }), { status: 200 }),
    );
    vi.stubEnv('RESEND_API_KEY', 'synthetic-resend-key');
    vi.stubEnv('RESEND_FROM', 'Palomares <noreply@example.test>');
    vi.stubEnv('REPORT_TO', 'moderation@example.test, editor@example.test');
    vi.stubGlobal('fetch', fetchMock);

    const result = await t.action(internal.palomarenos_notifications.notifySubmission, {
      submissionId: submitted.submissionId,
    });
    const duplicate = await t.action(internal.palomarenos_notifications.notifySubmission, {
      submissionId: submitted.submissionId,
    });
    const record = await t.query(internal.palomarenos.getById, { id: submitted.submissionId });
    const request = fetchMock.mock.calls[0];
    const requestBody: unknown = JSON.parse(String(request?.[1]?.body));

    expect(result).toEqual({ status: 'sent', externalId: 'resend-alert-1' });
    expect(duplicate).toEqual({ status: 'skipped' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(request?.[0]).toBe('https://api.resend.com/emails');
    expect(request?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer synthetic-resend-key',
      'Idempotency-Key': `palomarenos-${submitted.submissionId}`,
    });
    expect(requestBody).toMatchObject({
      to: ['moderation@example.test', 'editor@example.test'],
      subject: 'Palomares: nueva propuesta de Palomareños por el mundo',
    });
    expect(record).toMatchObject({
      notificationStatus: 'sent',
      notificationExternalId: 'resend-alert-1',
    });
  });

  it('records missing configuration and provider errors so failed alerts can be retried', async () => {
    const t = convexTest(schema, modules);
    const withoutConfig = await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    const missingConfigResult = await t.action(
      internal.palomarenos_notifications.notifySubmission,
      { submissionId: withoutConfig.submissionId },
    );
    const failedRecord = await t.query(internal.palomarenos.getById, {
      id: withoutConfig.submissionId,
    });

    expect(missingConfigResult).toEqual({ status: 'failed' });
    expect(failedRecord).toMatchObject({
      notificationStatus: 'failed',
      notificationError: 'resend-config-missing',
    });

    const providerFailure = await t.mutation(internal.palomarenos.createSubmission, {
      ...validSubmission,
      contactEmail: 'other@example.test',
    });
    vi.stubEnv('RESEND_API_KEY', 'synthetic-resend-key');
    vi.stubEnv('RESEND_FROM', 'Palomares <noreply@example.test>');
    vi.stubEnv('REPORT_TO', 'moderation@example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('unavailable', { status: 503 })),
    );

    expect(
      await t.action(internal.palomarenos_notifications.notifySubmission, {
        submissionId: providerFailure.submissionId,
      }),
    ).toEqual({ status: 'failed' });
    expect(
      await t.query(internal.palomarenos.getById, { id: providerFailure.submissionId }),
    ).toMatchObject({
      notificationStatus: 'failed',
      notificationError: 'resend-send-failed:resend-http-503',
    });
  });

  it('notifies the creator only after approval and records that notification independently', async () => {
    const t = convexTest(schema, modules);
    const submitted = await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ id: 'resend-approval-1' }), { status: 200 }),
    );
    vi.stubEnv('RESEND_API_KEY', 'synthetic-resend-key');
    vi.stubEnv('RESEND_FROM', 'Palomares <noreply@example.test>');
    vi.stubGlobal('fetch', fetchMock);

    expect(
      await t.action(internal.palomarenos_notifications.notifyApproved, {
        submissionId: submitted.submissionId,
      }),
    ).toEqual({ status: 'not-approved' });
    await t.mutation(internal.palomarenos.approve, {
      id: submitted.submissionId,
      latitude: 40.4168,
      longitude: -3.7038,
    });

    const result = await t.action(internal.palomarenos_notifications.notifyApproved, {
      submissionId: submitted.submissionId,
    });
    const duplicate = await t.action(internal.palomarenos_notifications.notifyApproved, {
      submissionId: submitted.submissionId,
    });
    const record = await t.query(internal.palomarenos.getById, { id: submitted.submissionId });
    const request = fetchMock.mock.calls[0];
    const requestBody: unknown = JSON.parse(String(request?.[1]?.body));

    expect(result).toEqual({ status: 'sent', externalId: 'resend-approval-1' });
    expect(duplicate).toEqual({ status: 'skipped' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestBody).toMatchObject({
      to: ['ana@example.com'],
      subject: 'Palomareños por el mundo: tu historia ya está publicada',
    });
    expect(record).toMatchObject({
      creatorNotificationStatus: 'sent',
      creatorNotificationExternalId: 'resend-approval-1',
    });
  });
});
