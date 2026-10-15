import { expect, expectTypeOf, it } from 'vitest';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import {
  submitPalomareno,
  type PalomarenoSubmissionResult,
} from '../../src/scripts/palomarenos-form';
import type { ConvexClient } from 'convex/browser';

it('exposes the generated submission action result as a precise type', () => {
  type ActionResult = FunctionReturnType<typeof api.palomarenos.submitWithTurnstile>;
  expectTypeOf<ActionResult>().toEqualTypeOf<PalomarenoSubmissionResult>();
});

it('submits public fields and forwards the honeypot for server validation', async () => {
  const calls: Array<{ reference: unknown; args: Record<string, unknown> }> = [];
  const client = {
    action: async (reference: unknown, args: Record<string, unknown>) => {
      calls.push({ reference, args });
      return {
        status: 'submitted',
        submissionId: 'palomareno-test',
        message: 'Tu propuesta queda pendiente de revisión.',
      };
    },
  } as unknown as Pick<ConvexClient, 'action'>;

  const result = await submitPalomareno(client, {
    displayName: 'Ana López',
    city: 'Madrid',
    country: 'España',
    story: 'Vuelvo al pueblo siempre que puedo.',
    contactEmail: 'ana@example.com',
    consent: true,
    website: 'filled-by-bot',
    turnstileToken: 'turnstile-token',
  });

  expect(result).toEqual({
    status: 'submitted',
    submissionId: 'palomareno-test',
    message: 'Tu propuesta queda pendiente de revisión.',
  });
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args).toEqual({
    displayName: 'Ana López',
    city: 'Madrid',
    country: 'España',
    story: 'Vuelvo al pueblo siempre que puedo.',
    contactEmail: 'ana@example.com',
    consent: true,
    website: 'filled-by-bot',
    turnstileToken: 'turnstile-token',
  });
  expect(calls[0]?.args).not.toHaveProperty('latitude');
  expect(calls[0]?.args).not.toHaveProperty('longitude');
  expect(calls[0]?.args).not.toHaveProperty('status');
});
