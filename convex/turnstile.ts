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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseTurnstileVerification = (value: unknown): TurnstileVerification => {
  if (
    !isRecord(value) ||
    typeof value.success !== 'boolean' ||
    (value.hostname !== undefined && typeof value.hostname !== 'string') ||
    (value.action !== undefined && typeof value.action !== 'string')
  ) {
    throw new Error('turnstile-provider-invalid-response');
  }

  return {
    success: value.success,
    ...(typeof value.hostname === 'string' ? { hostname: value.hostname } : {}),
    ...(typeof value.action === 'string' ? { action: value.action } : {}),
  };
};

export const isAcceptedTurnstileVerification = (
  verification: TurnstileVerification,
  options: TurnstileAcceptanceOptions,
): boolean => {
  if (!verification.success || !verification.hostname) return false;
  return (
    options.allowedHostnames.includes(verification.hostname) &&
    (options.expectedAction === undefined || verification.action === options.expectedAction)
  );
};

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

  return parseTurnstileVerification(await response.json());
};

export const parseTurnstileHostnames = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
