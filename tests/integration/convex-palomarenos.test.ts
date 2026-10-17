// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api, internal } from '../../convex/_generated/api';
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
  story: 'Vivo fuera, pero vuelvo al pueblo siempre que puedo.',
  contactEmail: 'Ana@Example.com',
  consent: true,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Convex Palomareños submission workflow', () => {
  it('stores submissions as private pending records and enforces the per-email limit', async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    const record = await t.query(internal.palomarenos.getById, { id: first.submissionId });
    const pending = await t.query(internal.palomarenos.listPending, {});

    expect(first).toMatchObject({
      status: 'submitted',
      message: 'Tu propuesta queda pendiente de revisión.',
    });
    expect(record).toMatchObject({
      displayName: 'Ana López',
      contactEmail: 'Ana@Example.com',
      contactEmailKey: 'ana@example.com',
      status: 'pending',
      notificationStatus: 'pending',
      creatorNotificationStatus: 'pending',
    });
    expect(pending.map(({ _id }) => _id)).toContain(first.submissionId);
    expect(await t.query(api.palomarenos.listApproved, {})).toEqual([]);

    await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    await expect(
      t.mutation(internal.palomarenos.createSubmission, validSubmission),
    ).rejects.toThrow('submission-rate-limited');
    expect(await t.run((ctx) => ctx.db.query('palomarenos').collect())).toHaveLength(3);
  });

  it('publishes only approved records with reviewed coordinates and redacts private fields', async () => {
    const t = convexTest(schema, modules);
    const submitted = await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    const reviewedAt = await t.mutation(internal.palomarenos.approve, {
      id: submitted.submissionId,
      latitude: 40.4168,
      longitude: -3.7038,
      reviewNote: 'Coordenadas verificadas.',
    });
    const publicRecords = await t.query(api.palomarenos.listApproved, {});
    const internalRecord = await t.query(internal.palomarenos.getById, {
      id: submitted.submissionId,
    });

    expect(reviewedAt.status).toBe('approved');
    expect(internalRecord).toMatchObject({
      status: 'approved',
      latitude: 40.4168,
      longitude: -3.7038,
      reviewNote: 'Coordenadas verificadas.',
    });
    expect(publicRecords).toEqual([
      {
        id: submitted.submissionId,
        displayName: validSubmission.displayName,
        city: validSubmission.city,
        country: validSubmission.country,
        latitude: 40.4168,
        longitude: -3.7038,
        story: validSubmission.story,
      },
    ]);
    expect(publicRecords[0]).not.toHaveProperty('contactEmail');
    expect(publicRecords[0]).not.toHaveProperty('reviewNote');

    await expect(
      t.mutation(internal.palomarenos.approve, {
        id: submitted.submissionId,
        latitude: 91,
        longitude: -3.7038,
      }),
    ).rejects.toThrow('invalid-review-coordinate');
  });

  it('enforces moderation transitions for rejection and withdrawal', async () => {
    const t = convexTest(schema, modules);
    const rejected = await t.mutation(internal.palomarenos.createSubmission, validSubmission);
    const withdrawn = await t.mutation(internal.palomarenos.createSubmission, {
      ...validSubmission,
      contactEmail: 'otra@example.com',
    });

    expect(
      await t.mutation(internal.palomarenos.reject, {
        id: rejected.submissionId,
        reviewNote: 'Faltan datos verificables.',
      }),
    ).toMatchObject({ status: 'rejected' });
    expect(
      await t.query(internal.palomarenos.getById, { id: rejected.submissionId }),
    ).toMatchObject({ status: 'rejected', reviewNote: 'Faltan datos verificables.' });

    expect(
      await t.mutation(internal.palomarenos.withdraw, {
        id: withdrawn.submissionId,
        reviewNote: 'Retirada solicitada por la autora.',
      }),
    ).toMatchObject({ status: 'withdrawn' });
    await expect(
      t.mutation(internal.palomarenos.withdraw, { id: withdrawn.submissionId }),
    ).rejects.toThrow('palomareno-already-withdrawn');
    await expect(
      t.mutation(internal.palomarenos.reject, { id: withdrawn.submissionId }),
    ).rejects.toThrow('palomareno-withdrawn');
    expect(await t.query(api.palomarenos.listApproved, {})).toEqual([]);
  });

  it('claims, completes and retries notification states without duplicate sends', async () => {
    const t = convexTest(schema, modules);
    const submitted = await t.mutation(internal.palomarenos.createSubmission, validSubmission);

    expect(
      await t.mutation(internal.palomarenos.claimNotification, { id: submitted.submissionId }),
    ).toEqual({ status: 'claimed' });
    expect(
      await t.mutation(internal.palomarenos.claimNotification, { id: submitted.submissionId }),
    ).toEqual({ status: 'skipped' });
    expect(
      await t.mutation(internal.palomarenos.markNotificationSent, {
        id: submitted.submissionId,
        externalId: 'email-message-1',
      }),
    ).toMatchObject({ status: 'sent' });
    expect(
      await t.mutation(internal.palomarenos.markNotificationSent, {
        id: submitted.submissionId,
        externalId: 'email-message-1',
      }),
    ).toEqual({ status: 'sent' });

    const creator = await t.mutation(internal.palomarenos.createSubmission, {
      ...validSubmission,
      contactEmail: 'creator@example.com',
    });
    expect(
      await t.query(internal.palomarenos.getCreatorNotificationStatus, {
        id: creator.submissionId,
      }),
    ).toMatchObject({ status: 'pending' });
    expect(
      await t.mutation(internal.palomarenos.claimCreatorNotification, { id: creator.submissionId }),
    ).toEqual({ status: 'not-approved' });
    await t.mutation(internal.palomarenos.approve, {
      id: creator.submissionId,
      latitude: 40.4168,
      longitude: -3.7038,
    });
    expect(
      await t.mutation(internal.palomarenos.claimCreatorNotification, { id: creator.submissionId }),
    ).toEqual({ status: 'claimed' });
    expect(
      await t.mutation(internal.palomarenos.claimCreatorNotification, { id: creator.submissionId }),
    ).toEqual({ status: 'skipped' });
    await t.mutation(internal.palomarenos.markCreatorNotificationFailed, {
      id: creator.submissionId,
      error: 'x'.repeat(300),
    });
    const creatorStatus = await t.query(internal.palomarenos.getCreatorNotificationStatus, {
      id: creator.submissionId,
    });
    const creatorRecord = await t.query(internal.palomarenos.getById, { id: creator.submissionId });

    expect(creatorStatus).toMatchObject({ status: 'failed', error: 'x'.repeat(240) });
    expect(creatorRecord?.creatorNotificationError).toHaveLength(240);
    expect(
      await t.mutation(internal.palomarenos.markNotificationFailed, {
        id: submitted.submissionId,
        error: 'provider-timeout',
      }),
    ).toEqual({ status: 'failed' });
    expect(
      await t.query(internal.palomarenos.getById, { id: submitted.submissionId }),
    ).toMatchObject({ notificationStatus: 'failed', notificationError: 'provider-timeout' });
  });

  it('verifies Turnstile before invoking the internal submission mutation', async () => {
    const t = convexTest(schema, modules);
    const args = { ...validSubmission, turnstileToken: 'synthetic-token' };

    vi.stubEnv('TURNSTILE_SECRET_KEY', 'synthetic-secret');
    vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', 'example.test');
    vi.stubEnv('TURNSTILE_EXPECTED_ACTION', 'submit-story');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: true, hostname: 'example.test', action: 'submit-story' }),
            { status: 200 },
          ),
      ),
    );

    const result = await t.action(api.palomarenos.submitWithTurnstile, args);
    const records = await t.run((ctx) => ctx.db.query('palomarenos').collect());

    expect(result).toMatchObject({
      status: 'submitted',
      message: 'Tu propuesta queda pendiente de revisión.',
    });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ status: 'pending', contactEmailKey: 'ana@example.com' });
  });

  it('rejects missing, misconfigured and unverified challenge tokens without storing a submission', async () => {
    const t = convexTest(schema, modules);
    const missingToken = { ...validSubmission, turnstileToken: '   ' };
    await expect(t.action(api.palomarenos.submitWithTurnstile, missingToken)).rejects.toThrow(
      'turnstile-token-missing',
    );

    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', '');
    await expect(
      t.action(api.palomarenos.submitWithTurnstile, {
        ...validSubmission,
        turnstileToken: 'token',
      }),
    ).rejects.toThrow('turnstile-not-configured');

    vi.stubEnv('TURNSTILE_SECRET_KEY', 'synthetic-secret');
    vi.stubEnv('TURNSTILE_ALLOWED_HOSTNAMES', 'example.test');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false, hostname: 'example.test' }), {
            status: 200,
          }),
      ),
    );
    await expect(
      t.action(api.palomarenos.submitWithTurnstile, {
        ...validSubmission,
        turnstileToken: 'token',
      }),
    ).rejects.toThrow('turnstile-invalid');
    expect(await t.run((ctx) => ctx.db.query('palomarenos').collect())).toHaveLength(0);
  });
});
