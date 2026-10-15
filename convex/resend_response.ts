const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseResendEmailId = (value: unknown): string => {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id.trim().length === 0) {
    throw new Error('resend-response-missing-id');
  }
  return value.id;
};

export const parseResendErrorBody = (value: unknown, status: number): string => {
  const fallback = `resend-http-${status}`;
  if (!isRecord(value)) return fallback;

  const message = typeof value.message === 'string' ? value.message : undefined;
  const error = typeof value.error === 'string' ? value.error : undefined;
  return message ?? error ?? fallback;
};
