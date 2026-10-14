import { describe, expect, it } from 'vitest';
import { isAcceptedTurnstileVerification } from '../../convex/turnstile';

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
});
