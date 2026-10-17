import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAcceptedTurnstileVerification,
  parseTurnstileHostnames,
  parseTurnstileVerification,
  TURNSTILE_VERIFY_URL,
  verifyTurnstileToken,
} from '../../convex/turnstile';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseTurnstileHostnames', () => {
  it('normalizes configured hostnames and ignores empty entries', () => {
    expect(parseTurnstileHostnames(' Example.TEST, ,localhost ')).toEqual([
      'example.test',
      'localhost',
    ]);
  });

  it('returns no allowed hostnames when configuration is absent', () => {
    expect(parseTurnstileHostnames(undefined)).toEqual([]);
  });
});

describe('verifyTurnstileToken', () => {
  it('posts the token and secret and parses a successful provider response', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({ success: true, hostname: 'example.test', action: 'submit-story' }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(verifyTurnstileToken('synthetic-token', 'synthetic-secret')).resolves.toEqual({
      success: true,
      hostname: 'example.test',
      action: 'submit-story',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      TURNSTILE_VERIFY_URL,
      expect.objectContaining({ method: 'POST' }),
    );
    const requestBody = new URLSearchParams(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody.get('response')).toBe('synthetic-token');
    expect(requestBody.get('secret')).toBe('synthetic-secret');
  });

  it('fails closed when the provider is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response('temporarily unavailable', { status: 503 })),
    );

    await expect(verifyTurnstileToken('synthetic-token', 'synthetic-secret')).rejects.toThrow(
      'turnstile-provider-unavailable',
    );
  });
});

describe('parseTurnstileVerification', () => {
  it('rejects malformed provider payloads instead of trusting a type assertion', () => {
    expect(() => parseTurnstileVerification(null)).toThrow('turnstile-provider-invalid-response');
    expect(() => parseTurnstileVerification([])).toThrow('turnstile-provider-invalid-response');
    expect(() => parseTurnstileVerification({ success: 'true' })).toThrow(
      'turnstile-provider-invalid-response',
    );
    expect(() => parseTurnstileVerification({ success: true, hostname: 42 })).toThrow(
      'turnstile-provider-invalid-response',
    );
    expect(() => parseTurnstileVerification({ success: true, action: false })).toThrow(
      'turnstile-provider-invalid-response',
    );
  });

  it('returns only typed optional fields from a valid provider payload', () => {
    expect(
      parseTurnstileVerification({
        success: true,
        hostname: 'palomaresdelcampo.conquense.dev',
        action: 'submit-story',
        score: 42,
      }),
    ).toEqual({
      success: true,
      hostname: 'palomaresdelcampo.conquense.dev',
      action: 'submit-story',
    });
  });

  it('leaves absent optional fields omitted', () => {
    expect(parseTurnstileVerification({ success: true })).toEqual({ success: true });
  });
});

describe('isAcceptedTurnstileVerification', () => {
  it('accepts a successful response from an allowed hostname', () => {
    expect(
      isAcceptedTurnstileVerification(
        { success: true, hostname: 'palomaresdelcampo.conquense.dev' },
        { allowedHostnames: ['palomaresdelcampo.conquense.dev'] },
      ),
    ).toBe(true);
  });

  it('rejects unsuccessful responses and unexpected hostnames', () => {
    expect(
      isAcceptedTurnstileVerification(
        { success: false },
        { allowedHostnames: ['palomaresdelcampo.conquense.dev'] },
      ),
    ).toBe(false);
    expect(
      isAcceptedTurnstileVerification(
        { success: true, hostname: 'attacker.example' },
        { allowedHostnames: ['palomaresdelcampo.conquense.dev'] },
      ),
    ).toBe(false);
  });

  it('requires the configured action when one is configured', () => {
    expect(
      isAcceptedTurnstileVerification(
        { success: true, hostname: 'palomaresdelcampo.conquense.dev', action: 'submit-story' },
        { allowedHostnames: ['palomaresdelcampo.conquense.dev'], expectedAction: 'submit-story' },
      ),
    ).toBe(true);
    expect(
      isAcceptedTurnstileVerification(
        { success: true, hostname: 'palomaresdelcampo.conquense.dev', action: 'other-action' },
        { allowedHostnames: ['palomaresdelcampo.conquense.dev'], expectedAction: 'submit-story' },
      ),
    ).toBe(false);
  });

  it('rejects missing or empty hostnames and a missing configured action', () => {
    const hostname = 'palomaresdelcampo.conquense.dev';

    expect(
      isAcceptedTurnstileVerification({ success: true }, { allowedHostnames: [hostname] }),
    ).toBe(false);
    expect(
      isAcceptedTurnstileVerification({ success: true, hostname: '' }, { allowedHostnames: [''] }),
    ).toBe(false);
    expect(
      isAcceptedTurnstileVerification(
        { success: true, hostname },
        { allowedHostnames: [hostname], expectedAction: 'submit-story' },
      ),
    ).toBe(false);
  });
});
