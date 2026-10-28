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
    const dimensions = { width: 1200, height: 800 };
    const preflight = vi.fn().mockResolvedValue(dimensions);
    const transform = vi.fn().mockResolvedValue(transformed);
    const onError = vi.fn();

    await expect(
      optimizeRemoteImage('https://images.example.test/poster.png', preflight, transform, onError),
    ).resolves.toEqual({
      source: 'https://images.example.test/poster.png',
      transformed,
    });
    expect(preflight).toHaveBeenCalledOnce();
    expect(transform).toHaveBeenCalledWith(dimensions);
    expect(onError).not.toHaveBeenCalled();
  });

  it('keeps the original URL and skips transformation when the remote preflight fails', async () => {
    const error = new Error('image source unavailable');
    const preflight = vi.fn().mockRejectedValue(error);
    const transform = vi.fn();
    const onError = vi.fn();

    await expect(
      optimizeRemoteImage('https://images.example.test/poster.png', preflight, transform, onError),
    ).resolves.toEqual({
      source: 'https://images.example.test/poster.png',
      transformed: null,
    });
    expect(transform).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('keeps the original remote URL when Astro image setup fails', async () => {
    const error = new Error('image source unavailable');
    const onError = vi.fn();
    const preflight = vi.fn().mockResolvedValue({ width: 800, height: 600 });

    await expect(
      optimizeRemoteImage(
        'https://images.example.test/poster.png',
        preflight,
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
