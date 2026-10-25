export type RemoteImageResult<T> = {
  source: string;
  transformed: T | null;
};

export const getResponsiveImageWidths = (
  intrinsicWidth: number,
  candidateWidths: number[],
): number[] =>
  [...candidateWidths.filter((width) => width < intrinsicWidth), intrinsicWidth].sort(
    (left, right) => left - right,
  );

/**
 * Falls back when remote probing or Astro image setup fails. Astro generates static
 * transforms later in the build; failures during that deferred phase still fail the build.
 */
export const optimizeRemoteImage = async <T, P>(
  source: string,
  preflight: () => Promise<P>,
  transform: (preflightResult: P) => Promise<T>,
  onError: (error: unknown) => void,
): Promise<RemoteImageResult<T>> => {
  try {
    const preflightResult = await preflight();
    return { source, transformed: await transform(preflightResult) };
  } catch (error) {
    onError(error);
    return { source, transformed: null };
  }
};
