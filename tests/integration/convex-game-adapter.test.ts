import { describe, expect, it } from 'vitest';
import {
  createRemoteGameAdapter,
  type RemoteConvexClient,
  type RemoteGameState,
} from '../../src/scripts/convex-game';

const seasonState: RemoteGameState = {
  season: {
    id: 'season-test',
    slug: 'temporada-test',
    name: 'Temporada de prueba',
    status: 'active',
    capturePoints: 10,
  },
  ball: {
    version: 3,
    locationId: 'plaza-del-coso',
    locationName: 'Plaza del Coso',
    latitude: 39.9463,
    longitude: -2.5988,
    radiusMeters: 55,
  },
  playerCount: 1,
  players: [],
};

const createClientFixture = () => {
  const queryCalls: Array<{ reference: unknown; args: Record<string, unknown> }> = [];
  const mutationCalls: Array<{ reference: unknown; args: Record<string, unknown> }> = [];
  const updateCallbacks: Array<(value: unknown) => void> = [];
  const unsubscribeCalls: number[] = [];
  let closeCalls = 0;
  let queryNumber = 0;

  const client: RemoteConvexClient = {
    query: async (reference, args) => {
      queryCalls.push({ reference, args });
      queryNumber += 1;
      if (queryNumber === 1) return seasonState;
      if (queryNumber === 2) return { nickname: 'Pájaro Verde', score: 10, captures: 1 };
      return [{ nickname: 'Pájaro Verde', score: 10, captures: 1, position: 1 }];
    },
    mutation: async (reference, args) => {
      mutationCalls.push({ reference, args });
      if (mutationCalls.length === 1) {
        return {
          status: 'joined',
          playerId: 'player-test',
          returning: false,
          progressReset: false,
        };
      }
      if (mutationCalls.length === 2) return { status: 'updated', presenceAt: 1234 };
      return { status: 'accepted', points: 10, score: 20, ballVersion: 4 };
    },
    onUpdate: (_reference, _args, callback) => {
      updateCallbacks.push(callback);
      const subscriptionNumber = updateCallbacks.length;
      return () => unsubscribeCalls.push(subscriptionNumber);
    },
    close: () => {
      closeCalls += 1;
    },
  };

  return {
    client,
    queryCalls,
    mutationCalls,
    updateCallbacks,
    unsubscribeCalls,
    get closeCalls() {
      return closeCalls;
    },
  };
};

describe('remote Convex game adapter', () => {
  it('joins, emits initial state and subscribes to live updates', async () => {
    const fixture = createClientFixture();
    const states: RemoteGameState[] = [];
    const players: unknown[] = [];
    const leaderboards: unknown[] = [];

    const adapter = await createRemoteGameAdapter(
      fixture.client,
      {
        deviceId: 'device-test',
        nickname: 'Pájaro Verde',
      },
      {
        onState: (state) => states.push(state),
        onPlayer: (player) => players.push(player),
        onLeaderboard: (entries) => leaderboards.push(entries),
      },
    );

    expect(adapter.seasonId).toBe('season-test');
    expect(states).toEqual([seasonState]);
    expect(players).toEqual([{ nickname: 'Pájaro Verde', score: 10, captures: 1 }]);
    expect(leaderboards).toEqual([
      [{ nickname: 'Pájaro Verde', score: 10, captures: 1, position: 1 }],
    ]);
    expect(fixture.mutationCalls[0]?.args).toMatchObject({
      seasonId: 'season-test',
      deviceId: 'device-test',
      displayName: 'Pájaro Verde',
    });
    expect(fixture.updateCallbacks).toHaveLength(3);

    const nextState = { ...seasonState, ball: { ...seasonState.ball, version: 4 } };
    fixture.updateCallbacks[0]?.(nextState);
    fixture.updateCallbacks[1]?.(null);
    fixture.updateCallbacks[2]?.([]);

    expect(states).toEqual([seasonState, nextState]);
    expect(players).toEqual([{ nickname: 'Pájaro Verde', score: 10, captures: 1 }, null]);
    expect(leaderboards).toEqual([
      [{ nickname: 'Pájaro Verde', score: 10, captures: 1, position: 1 }],
      [],
    ]);

    adapter.dispose();
    expect(fixture.unsubscribeCalls).toEqual([1, 2, 3]);
    expect(fixture.closeCalls).toBe(1);
  });

  it('sends presence and capture commands with the current season and ball version', async () => {
    const fixture = createClientFixture();
    const adapter = await createRemoteGameAdapter(
      fixture.client,
      { deviceId: 'device-test', nickname: 'Pájaro Verde' },
      { onState: () => undefined, onPlayer: () => undefined, onLeaderboard: () => undefined },
    );

    await adapter.updatePresence({ latitude: 39.94636, longitude: -2.59884 });
    const captureResult = await adapter.capture(
      { latitude: 39.9463, longitude: -2.5988, accuracy: 8 },
      3,
    );

    expect(fixture.mutationCalls[1]?.args).toEqual({
      seasonId: 'season-test',
      deviceId: 'device-test',
      latitude: 39.94636,
      longitude: -2.59884,
    });
    expect(fixture.mutationCalls[2]?.args).toMatchObject({
      seasonId: 'season-test',
      deviceId: 'device-test',
      latitude: 39.9463,
      longitude: -2.5988,
      accuracy: 8,
      expectedBallVersion: 3,
    });
    expect(fixture.mutationCalls[2]?.args.idempotencyKey).toMatch(/^[a-f0-9]{32}$/);
    expect(captureResult).toEqual({ status: 'accepted', points: 10, score: 20, ballVersion: 4 });

    adapter.dispose();
  });
});
