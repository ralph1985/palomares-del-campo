import { createServer } from 'node:net';
import { expect, it } from 'vitest';
import { findAvailablePort } from '../../scripts/find-available-port.ts';

it('skips a port already in use and returns the next bindable one', async () => {
  const blocker = createServer();
  await new Promise<void>((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = blocker.address();
    if (!address || typeof address === 'string') throw new Error('Expected a TCP address.');

    const availablePort = await findAvailablePort(address.port);
    expect(availablePort).toBeGreaterThan(address.port);

    const verifier = createServer();
    await new Promise<void>((resolve, reject) => {
      verifier.once('error', reject);
      verifier.listen(availablePort, '127.0.0.1', resolve);
    });
    await new Promise<void>((resolve, reject) => {
      verifier.close((error) => (error ? reject(error) : resolve()));
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      blocker.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
