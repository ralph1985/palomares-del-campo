import { createServer } from 'node:net';

async function isPortAvailable(port: number, host: string): Promise<boolean> {
  const server = createServer();
  return new Promise<boolean>((resolve, reject) => {
    server.once('error', (error) => {
      if ('code' in error && error.code === 'EADDRINUSE') resolve(false);
      else reject(error);
    });
    server.listen({ host, port, exclusive: true }, () => {
      server.close((error) => (error ? reject(error) : resolve(true)));
    });
  });
}

export async function findAvailablePort(startPort = 4321, host = '127.0.0.1'): Promise<number> {
  for (let port = startPort; port <= 65535; port += 1) {
    if (await isPortAvailable(port, host)) return port;
  }
  throw new Error(`No available TCP port found from ${startPort} on ${host}.`);
}
