export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerification = {
  success: boolean;
  hostname?: string;
  action?: string;
};

export type TurnstileAcceptanceOptions = {
  allowedHostnames: string[];
  expectedAction?: string;
};

export const isAcceptedTurnstileVerification = (
  verification: TurnstileVerification,
  options: TurnstileAcceptanceOptions,
): boolean =>
  verification.success &&
  Boolean(verification.hostname) &&
  options.allowedHostnames.includes(verification.hostname as string) &&
  (options.expectedAction === undefined || verification.action === options.expectedAction);

export const verifyTurnstileToken = async (
  token: string,
  secret: string,
): Promise<TurnstileVerification> => {
  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  if (!response.ok) throw new Error('turnstile-provider-unavailable');

  const verification = (await response.json()) as TurnstileVerification;
  if (typeof verification.success !== 'boolean') {
    throw new Error('turnstile-provider-invalid-response');
  }
  return verification;
};

export const parseTurnstileHostnames = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
