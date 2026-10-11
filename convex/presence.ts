export const PRESENCE_TTL_MS = 30_000;
export const PRESENCE_HEARTBEAT_MS = 10_000;
export const PRESENCE_COORDINATE_DECIMALS = 4;

export const roundPresenceCoordinate = (coordinate: number): number =>
  Number(coordinate.toFixed(PRESENCE_COORDINATE_DECIMALS));

export const isPresenceActive = (lastSeenAt: number, now: number): boolean =>
  now - lastSeenAt < PRESENCE_TTL_MS;
