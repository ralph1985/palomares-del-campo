import { describe, expect, it, vi } from 'vitest';
import { retryAfterDevNavigationAbort } from '../../scripts/visual-qa-navigation';

describe('retryAfterDevNavigationAbort', () => {
  it('retries a single navigation aborted by the development server', async () => {
    const navigate = vi.fn<() => Promise<string>>();
    const onRetry = vi.fn();
    navigate.mockRejectedValueOnce(new Error('page.goto: net::ERR_ABORTED'));
    navigate.mockResolvedValueOnce('loaded');

    await expect(retryAfterDevNavigationAbort(navigate, onRetry)).resolves.toBe('loaded');
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not retry unrelated navigation errors', async () => {
    const error = new Error('connection refused');
    const navigate = vi.fn<() => Promise<string>>().mockRejectedValue(error);

    await expect(retryAfterDevNavigationAbort(navigate)).rejects.toBe(error);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('does not retry a second aborted navigation', async () => {
    const error = new Error('page.goto: net::ERR_ABORTED');
    const navigate = vi.fn<() => Promise<string>>().mockRejectedValue(error);

    await expect(retryAfterDevNavigationAbort(navigate)).rejects.toBe(error);
    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
