import { describe, expect, it, vi } from 'vitest';

import { getResponsiveImageWidths, optimizeRemoteImage } from '../../src/images';

describe('getResponsiveImageWidths', () => {
  it('caps responsive candidates at the intrinsic image width', () => {
    expect(getResponsiveImageWidths(453, [320, 640, 864])).toEqual([320, 453]);
  });

  it('keeps a source narrower than the smallest standard candidate at its native width', () => {
    expect(getResponsiveImageWidths(180, [320, 640, 864])).toEqual([180]);
  });
});

describe('optimizeRemoteImage', () => {
  it('returns the transformed image when the source can be processed', async () => {
    const transformed = { src: '/_astro/image.hash.webp' };

    const onError = vi.fn();

    await expect(
      optimizeRemoteImage(
        'https://images.example.test/poster.png',
        async () => transformed,
        onError,
      ),
    ).resolves.toEqual({
      source: 'https://images.example.test/poster.png',
      transformed,
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('keeps the original remote URL when image processing fails', async () => {
    const error = new Error('image source unavailable');
    const onError = vi.fn();

    await expect(
      optimizeRemoteImage(
        'https://images.example.test/poster.png',
        async () => {
          throw error;
        },
        onError,
      ),
    ).resolves.toEqual({
      source: 'https://images.example.test/poster.png',
      transformed: null,
    });
    expect(onError).toHaveBeenCalledWith(error);
  });
});
