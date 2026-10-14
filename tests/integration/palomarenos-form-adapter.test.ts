import { expect, it } from 'vitest';
import { submitPalomareno } from '../../src/scripts/palomarenos-form';

it('submits only the public form fields to Convex', async () => {
  const calls: Array<{ reference: unknown; args: Record<string, unknown> }> = [];
  const client = {
    mutation: async (reference: unknown, args: Record<string, unknown>) => {
      calls.push({ reference, args });
      return {
        status: 'submitted',
        submissionId: 'palomareno-test',
        message: 'Tu propuesta queda pendiente de revisión.',
      };
    },
  };

  const result = await submitPalomareno(client, {
    displayName: 'Ana López',
    city: 'Madrid',
    country: 'España',
    story: 'Vuelvo al pueblo siempre que puedo.',
    contactEmail: 'ana@example.com',
    consent: true,
  });

  expect(result.status).toBe('submitted');
  expect(calls).toHaveLength(1);
  expect(calls[0]?.args).toEqual({
    displayName: 'Ana López',
    city: 'Madrid',
    country: 'España',
    story: 'Vuelvo al pueblo siempre que puedo.',
    contactEmail: 'ana@example.com',
    consent: true,
  });
  expect(calls[0]?.args).not.toHaveProperty('latitude');
  expect(calls[0]?.args).not.toHaveProperty('longitude');
  expect(calls[0]?.args).not.toHaveProperty('status');
});
