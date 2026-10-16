import { ConvexClient } from 'convex/browser';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';

export type PlayerIdentity = {
  deviceId: string;
  nickname: string;
};

export type RemoteGameState = NonNullable<FunctionReturnType<typeof api.game.getActiveSeason>>;

export type RemotePlayerPresence = RemoteGameState['players'][number];

export type RemotePlayerSummary = NonNullable<FunctionReturnType<typeof api.game.getPlayerSummary>>;

export type RemoteLeaderboardEntry = FunctionReturnType<
  typeof api.leaderboard.getLeaderboard
>[number];

export type RemoteCaptureResult = FunctionReturnType<typeof api.game.captureBall>;

const PLAYER_STORAGE_KEY = 'palomares-player-v1';

const createRandomId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createDeviceId = (): string => createRandomId();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parsePlayerIdentity = (value: unknown): PlayerIdentity | null => {
  if (
    !isRecord(value) ||
    typeof value.deviceId !== 'string' ||
    typeof value.nickname !== 'string'
  ) {
    return null;
  }

  return { deviceId: value.deviceId, nickname: value.nickname };
};

export const loadPlayerIdentity = (): PlayerIdentity => {
  try {
    const stored = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      const identity = parsePlayerIdentity(parsed);
      if (identity) return identity;
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
  updatePresence: (position: {
    latitude: number;
    longitude: number;
  }) => Promise<FunctionReturnType<typeof api.game.updatePresence>>;
  dispose: () => void;
};

export type RemoteLeaderboardAdapter = {
  dispose: () => void;
};

export type RemoteConvexClient = Pick<ConvexClient, 'query' | 'mutation' | 'onUpdate' | 'close'>;

export const connectRemoteLeaderboard = async (
  url: string,
  onLeaderboard: (entries: RemoteLeaderboardEntry[]) => void,
): Promise<RemoteLeaderboardAdapter> => {
  const client = new ConvexClient(url);
  const state = await client.query(api.game.getActiveSeason, {});
  if (!state) throw new Error('no-active-season');
  const seasonId = state.season.id;
  onLeaderboard(await client.query(api.leaderboard.getLeaderboard, { seasonId }));
  const stop = client.onUpdate(api.leaderboard.getLeaderboard, { seasonId }, (entries) =>
    onLeaderboard(entries),
  );
  return {
    dispose: () => {
      stop();
      client.close();
    },
  };
};

export const createRemoteGameAdapter = async (
  client: RemoteConvexClient,
  identity: PlayerIdentity,
  callbacks: RemoteGameCallbacks,
): Promise<RemoteGameAdapter> => {
  const state = await client.query(api.game.getActiveSeason, {});
  if (!state) throw new Error('no-active-season');

  const seasonId = state.season.id;
  const joined = await client.mutation(api.game.joinSeason, {
    seasonId,
    deviceId: identity.deviceId,
    displayName: identity.nickname,
  });
  if (joined.status !== 'joined') throw new Error(joined.status);

  callbacks.onState(state);
  callbacks.onPlayer(
    await client.query(api.game.getPlayerSummary, {
      seasonId,
      deviceId: identity.deviceId,
    }),
  );
  callbacks.onLeaderboard(await client.query(api.leaderboard.getLeaderboard, { seasonId }));

  const stopState = client.onUpdate(api.game.getSeasonState, { seasonId }, (nextState) => {
    if (nextState) callbacks.onState(nextState);
  });
  const stopPlayer = client.onUpdate(
    api.game.getPlayerSummary,
    { seasonId, deviceId: identity.deviceId },
    (player) => callbacks.onPlayer(player),
  );
  const stopLeaderboard = client.onUpdate(api.leaderboard.getLeaderboard, { seasonId }, (entries) =>
    callbacks.onLeaderboard(entries),
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
        ...(position.accuracy === undefined ? {} : { accuracy: position.accuracy }),
        expectedBallVersion,
        idempotencyKey: createRandomId(),
      }),
    updatePresence: (position) =>
      client.mutation(api.game.updatePresence, {
        seasonId,
        deviceId: identity.deviceId,
        latitude: position.latitude,
        longitude: position.longitude,
      }),
    dispose: () => {
      stopState();
      stopPlayer();
      stopLeaderboard();
      client.close();
    },
  };
};

export const connectRemoteGame = async (
  url: string,
  identity: PlayerIdentity,
  callbacks: RemoteGameCallbacks,
): Promise<RemoteGameAdapter> =>
  createRemoteGameAdapter(new ConvexClient(url), identity, callbacks);
