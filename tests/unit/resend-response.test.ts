import { describe, expect, it } from 'vitest';
import { parseResendEmailId, parseResendErrorBody } from '../../convex/resend_response';

describe('Resend response parsing', () => {
  it('accepts a non-empty string email id', () => {
    expect(parseResendEmailId({ id: 'email-test-123' })).toBe('email-test-123');
  });

  it('rejects missing, empty, and wrongly typed email ids', () => {
    expect(() => parseResendEmailId(null)).toThrow('resend-response-missing-id');
    expect(() => parseResendEmailId([])).toThrow('resend-response-missing-id');
    expect(() => parseResendEmailId({ id: 123 })).toThrow('resend-response-missing-id');
    expect(() => parseResendEmailId({ id: '  ' })).toThrow('resend-response-missing-id');
  });

  it('uses a provider message or error string when present', () => {
    expect(parseResendErrorBody({ message: 'Message', error: 'Error' }, 502)).toBe('Message');
    expect(parseResendErrorBody({ error: 'Error' }, 502)).toBe('Error');
  });

  it('falls back safely for malformed error bodies', () => {
    expect(parseResendErrorBody(null, 502)).toBe('resend-http-502');
    expect(parseResendErrorBody({ message: 42, error: false }, 502)).toBe('resend-http-502');
  });
});
