import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';

export type PlayerIdentity = {
  deviceId: string;
  nickname: string;
};

export type RemoteGameState = {
  season: {
    id: string;
    slug: string;
    name: string;
    status: string;
    capturePoints: number;
  };
  ball: {
    version: number;
    locationId: string;
    locationName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  playerCount: number;
};

export type RemotePlayerSummary = {
  nickname: string;
  score: number;
  captures: number;
};

export type RemoteLeaderboardEntry = RemotePlayerSummary & {
  position: number;
};

export type RemoteCaptureResult = {
  status: string;
  duplicate?: boolean;
  points?: number;
  score?: number;
  ballVersion?: number;
  activeLocationId?: string;
  distanceMeters?: number;
};

const PLAYER_STORAGE_KEY = 'palomares-player-v1';

const createRandomId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createDeviceId = (): string => createRandomId();

export const loadPlayerIdentity = (): PlayerIdentity => {
  try {
    const stored = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PlayerIdentity>;
      if (typeof parsed.deviceId === 'string' && typeof parsed.nickname === 'string') {
        return { deviceId: parsed.deviceId, nickname: parsed.nickname };
      }
    }
  } catch {
    // La partida puede continuar sin identidad persistida.
  }

  return { deviceId: createDeviceId(), nickname: '' };
};

export const storePlayerIdentity = (identity: PlayerIdentity): void => {
  try {
    window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // El jugador podrá volver a introducir el nick si el almacenamiento está bloqueado.
  }
};

export type RemoteGameCallbacks = {
  onState: (state: RemoteGameState) => void;
  onPlayer: (player: RemotePlayerSummary | null) => void;
  onLeaderboard: (entries: RemoteLeaderboardEntry[]) => void;
};

export type RemoteGameAdapter = {
  identity: PlayerIdentity;
  seasonId: string;
  capture: (
    position: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    },
    expectedBallVersion: number,
  ) => Promise<RemoteCaptureResult>;
  dispose: () => void;
};

export type RemoteLeaderboardAdapter = {
  dispose: () => void;
};

export const connectRemoteLeaderboard = async (
  url: string,
  onLeaderboard: (entries: RemoteLeaderboardEntry[]) => void,
): Promise<RemoteLeaderboardAdapter> => {
  const client = new ConvexClient(url);
  const state = await client.query(api.game.getActiveSeason, {});
  if (!state) throw new Error('no-active-season');
  const seasonId = state.season.id;
  onLeaderboard(
    (await client.query(api.leaderboard.getLeaderboard, { seasonId })) as RemoteLeaderboardEntry[],
  );
  const stop = client.onUpdate(api.leaderboard.getLeaderboard, { seasonId }, (entries) =>
    onLeaderboard(entries as RemoteLeaderboardEntry[]),
  );
  return {
    dispose: () => {
      stop();
      client.close();
    },
  };
};

export const connectRemoteGame = async (
  url: string,
  identity: PlayerIdentity,
  callbacks: RemoteGameCallbacks,
): Promise<RemoteGameAdapter> => {
  const client = new ConvexClient(url);
  const state = await client.query(api.game.getActiveSeason, {});
  if (!state) throw new Error('no-active-season');

  const seasonId = state.season.id;
  const joined = await client.mutation(api.game.joinSeason, {
    seasonId,
    deviceId: identity.deviceId,
    displayName: identity.nickname,
  });
  if (joined.status !== 'joined') throw new Error(joined.status);

  callbacks.onState(state as RemoteGameState);
  callbacks.onPlayer(
    (await client.query(api.game.getPlayerSummary, {
      seasonId,
      deviceId: identity.deviceId,
    })) as RemotePlayerSummary | null,
  );
  callbacks.onLeaderboard(
    (await client.query(api.leaderboard.getLeaderboard, { seasonId })) as RemoteLeaderboardEntry[],
  );

  const stopState = client.onUpdate(api.game.getSeasonState, { seasonId }, (nextState) => {
    if (nextState) callbacks.onState(nextState as RemoteGameState);
  });
  const stopPlayer = client.onUpdate(
    api.game.getPlayerSummary,
    { seasonId, deviceId: identity.deviceId },
    (player) => callbacks.onPlayer(player as RemotePlayerSummary | null),
  );
  const stopLeaderboard = client.onUpdate(api.leaderboard.getLeaderboard, { seasonId }, (entries) =>
    callbacks.onLeaderboard(entries as RemoteLeaderboardEntry[]),
  );

  return {
    identity,
    seasonId,
    capture: (position, expectedBallVersion) =>
      client.mutation(api.game.captureBall, {
        seasonId,
        deviceId: identity.deviceId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        expectedBallVersion,
        idempotencyKey: createRandomId(),
      }) as Promise<RemoteCaptureResult>,
    dispose: () => {
      stopState();
      stopPlayer();
      stopLeaderboard();
      client.close();
    },
  };
};
