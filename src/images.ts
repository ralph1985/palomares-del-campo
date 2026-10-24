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

export const optimizeRemoteImage = async <T>(
  source: string,
  transform: () => Promise<T>,
  onError: (error: unknown) => void,
): Promise<RemoteImageResult<T>> => {
  try {
    return { source, transformed: await transform() };
  } catch (error) {
    onError(error);
    return { source, transformed: null };
  }
};
