export const retryAfterDevNavigationAbort = async <T>(
  navigate: () => Promise<T>,
  onRetry: (error: Error) => void = () => undefined,
): Promise<T> => {
  try {
    return await navigate();
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('net::ERR_ABORTED')) throw error;
    onRetry(error);
    return navigate();
  }
};
