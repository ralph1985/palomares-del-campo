// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = (
  import.meta as ImportMeta & {
    glob: (pattern: string) => Record<string, () => Promise<unknown>>;
  }
).glob('../../convex/**/*.ts');

const location = {
  locationId: 'plaza-del-coso',
  name: 'Plaza del Coso',
  latitude: 39.9463,
  longitude: -2.5988,
  radiusMeters: 55,
};

const createSeasonArgs = {
  slug: 'temporada-prueba',
  name: 'Temporada de prueba',
  locations: [location],
};

describe('Convex game functions', () => {
  it('creates an active season and starts the ball at its first location', async () => {
    const t = convexTest(schema, modules);
    const organizer = t.withIdentity({ subject: 'organizer-test' });

    const result = await organizer.mutation(api.game.createSeason, createSeasonArgs);
    const state = await t.query(api.game.getSeasonState, { seasonId: result.seasonId });

    expect(result).toMatchObject({ status: 'active', ballVersion: 0 });
    expect(state).toMatchObject({
      season: {
        id: result.seasonId,
        slug: createSeasonArgs.slug,
        name: createSeasonArgs.name,
        status: 'active',
        capturePoints: 10,
      },
      ball: {
        version: 0,
        locationId: location.locationId,
        locationName: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: location.radiusMeters,
      },
      playerCount: 0,
      players: [],
    });
  });

  it('rejects season creation without an authenticated organizer', async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.game.createSeason, createSeasonArgs)).rejects.toThrow(
      'auth-required',
    );
    const seasons = await t.run((ctx) => ctx.db.query('seasons').collect());
    expect(seasons).toHaveLength(0);
  });

  it('rejects invalid location sets before creating any records', async () => {
    const cases: Array<{ locations: typeof createSeasonArgs.locations; error: string }> = [
      { locations: [], error: 'locations-required' },
      {
        locations: [location, { ...location, name: 'Otra ubicación' }],
        error: 'duplicate-location-id',
      },
      { locations: [{ ...location, radiusMeters: 0 }], error: 'invalid-location-radius' },
      { locations: [{ ...location, latitude: 91 }], error: 'invalid-location-coordinates' },
    ];

    for (const [index, testCase] of cases.entries()) {
      const t = convexTest(schema, modules);
      const organizer = t.withIdentity({ subject: `organizer-${index}` });

      await expect(
        organizer.mutation(api.game.createSeason, {
          ...createSeasonArgs,
          slug: `season-${index}`,
          locations: testCase.locations,
        }),
      ).rejects.toThrow(testCase.error);
      expect(await t.run((ctx) => ctx.db.query('seasons').collect())).toHaveLength(0);
    }
  });

  it('allows only one active season and keeps slugs unique', async () => {
    const t = convexTest(schema, modules);
    const organizer = t.withIdentity({ subject: 'organizer-test' });

    await organizer.mutation(api.game.createSeason, createSeasonArgs);

    await expect(
      organizer.mutation(api.game.createSeason, {
        ...createSeasonArgs,
        slug: 'otra-temporada',
      }),
    ).rejects.toThrow('active-season-exists');

    await expect(organizer.mutation(api.game.createSeason, createSeasonArgs)).rejects.toThrow(
      'season-slug-already-exists',
    );
    expect(await t.run((ctx) => ctx.db.query('seasons').collect())).toHaveLength(1);
  });

  it('reserves normalized nicknames and resets a returning player after a rename', async () => {
    const t = convexTest(schema, modules);
    const { seasonId } = await t
      .withIdentity({ subject: 'organizer-test' })
      .mutation(api.game.createSeason, createSeasonArgs);
    const firstPlayer = await t.mutation(api.game.joinSeason, {
      seasonId,
      deviceId: 'device-one',
      displayName: '  Pájaro Verde  ',
    });

    expect(firstPlayer).toMatchObject({ status: 'joined', returning: false, progressReset: false });
    expect(
      await t.mutation(api.game.joinSeason, {
        seasonId,
        deviceId: 'device-two',
        displayName: 'pájaro verde',
      }),
    ).toEqual({ status: 'nickname-taken' });

    await t.mutation(api.game.updatePresence, {
      seasonId,
      deviceId: 'device-one',
      latitude: location.latitude,
      longitude: location.longitude,
    });
    await t.mutation(api.game.captureBall, {
      seasonId,
      deviceId: 'device-one',
      latitude: location.latitude,
      longitude: location.longitude,
      expectedBallVersion: 0,
      idempotencyKey: 'rename-after-capture',
    });

    const renamed = await t.mutation(api.game.joinSeason, {
      seasonId,
      deviceId: 'device-one',
      displayName: 'Pájaro Azul',
    });
    const summary = await t.query(api.game.getPlayerSummary, { seasonId, deviceId: 'device-one' });
    const state = await t.query(api.game.getSeasonState, { seasonId });

    expect(renamed).toMatchObject({ status: 'joined', returning: false, progressReset: true });
    expect(summary).toEqual({ nickname: 'Pájaro Azul', score: 0, captures: 0 });
    expect(state).toMatchObject({ playerCount: 1, players: [] });
  });

  it('moves the ball once and makes capture retries idempotent', async () => {
    const t = convexTest(schema, modules);
    const organizer = t.withIdentity({ subject: 'organizer-test' });
    const secondLocation = {
      ...location,
      locationId: 'mirador',
      name: 'El Mirador',
      latitude: 39.9465,
      longitude: -2.5987,
    };
    const { seasonId } = await organizer.mutation(api.game.createSeason, {
      ...createSeasonArgs,
      locations: [location, secondLocation],
    });
    await t.mutation(api.game.joinSeason, {
      seasonId,
      deviceId: 'device-one',
      displayName: 'Pájaro Verde',
    });
    const captureRequest = {
      seasonId,
      deviceId: 'device-one',
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: 8,
      expectedBallVersion: 0,
      idempotencyKey: 'capture-first-location',
    };

    const accepted = await t.mutation(api.game.captureBall, captureRequest);
    const duplicate = await t.mutation(api.game.captureBall, captureRequest);
    const conflict = await t.mutation(api.game.captureBall, {
      ...captureRequest,
      latitude: location.latitude + 0.001,
    });
    const stale = await t.mutation(api.game.captureBall, {
      ...captureRequest,
      idempotencyKey: 'stale-ball-request',
    });
    const lowAccuracy = await t.mutation(api.game.captureBall, {
      ...captureRequest,
      latitude: secondLocation.latitude,
      longitude: secondLocation.longitude,
      accuracy: 101,
      expectedBallVersion: 1,
      idempotencyKey: 'low-accuracy-request',
    });
    const outsideRadius = await t.mutation(api.game.captureBall, {
      ...captureRequest,
      latitude: 0,
      longitude: 0,
      accuracy: 5,
      expectedBallVersion: 1,
      idempotencyKey: 'outside-radius-request',
    });
    const state = await t.query(api.game.getSeasonState, { seasonId });
    const summary = await t.query(api.game.getPlayerSummary, { seasonId, deviceId: 'device-one' });
    const leaderboard = await t.query(api.leaderboard.getLeaderboard, { seasonId });
    const captures = await t.run((ctx) => ctx.db.query('captures').collect());

    expect(accepted).toMatchObject({
      status: 'accepted',
      duplicate: false,
      points: 10,
      score: 10,
      ballVersion: 1,
      activeLocationId: secondLocation.locationId,
    });
    expect(duplicate).toMatchObject({ status: 'accepted', duplicate: true, score: 10 });
    expect(conflict).toMatchObject({ status: 'idempotency-conflict', ballVersion: 1 });
    expect(stale).toMatchObject({ status: 'stale-ball', ballVersion: 1 });
    expect(lowAccuracy).toMatchObject({ status: 'low-accuracy' });
    expect(outsideRadius).toMatchObject({ status: 'outside-radius' });
    expect(state).toMatchObject({ ball: { version: 1, locationId: secondLocation.locationId } });
    expect(summary).toEqual({ nickname: 'Pájaro Verde', score: 10, captures: 1 });
    expect(leaderboard).toMatchObject([
      { position: 1, nickname: 'Pájaro Verde', score: 10, captures: 1 },
    ]);
    expect(captures).toHaveLength(1);
  });

  it('publishes only fresh rounded presence while retaining the total player count', async () => {
    const t = convexTest(schema, modules);
    const { seasonId } = await t
      .withIdentity({ subject: 'organizer-test' })
      .mutation(api.game.createSeason, createSeasonArgs);
    await t.mutation(api.game.joinSeason, {
      seasonId,
      deviceId: 'device-one',
      displayName: 'Pájaro Verde',
    });
    await t.mutation(api.game.joinSeason, {
      seasonId,
      deviceId: 'device-two',
      displayName: 'Pájaro Azul',
    });

    const updated = await t.mutation(api.game.updatePresence, {
      seasonId,
      deviceId: 'device-one',
      latitude: 39.94636,
      longitude: -2.59884,
    });
    const freshState = await t.query(api.game.getSeasonState, { seasonId });

    expect(updated.status).toBe('updated');
    expect(freshState).toMatchObject({
      playerCount: 2,
      players: [{ nickname: 'Pájaro Verde', latitude: 39.9464, longitude: -2.5988 }],
    });

    const player = await t.run((ctx) =>
      ctx.db
        .query('players')
        .withIndex('by_season_subject', (query) =>
          query.eq('seasonId', seasonId).eq('subject', 'device-one'),
        )
        .unique(),
    );
    if (!player) throw new Error('expected test player to exist');
    await t.run((ctx) => ctx.db.patch(player._id, { presenceAt: 0 }));

    expect(await t.query(api.game.getSeasonState, { seasonId })).toMatchObject({
      playerCount: 2,
      players: [],
    });
  });

  it('rejects invalid, stale and unavailable game commands without changing the game', async () => {
    const t = convexTest(schema, modules);
    const organizer = t.withIdentity({ subject: 'organizer-test' });
    const { seasonId } = await organizer.mutation(api.game.createSeason, createSeasonArgs);
    const { playerId } = await t.mutation(api.game.joinSeason, {
      seasonId,
      deviceId: 'device-one',
      displayName: 'Pájaro Verde',
    });

    expect(
      await t.mutation(api.game.updatePresence, {
        seasonId,
        deviceId: 'unknown-device',
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    ).toEqual({ status: 'player-not-found' });
    expect(
      await t.mutation(api.game.updatePresence, {
        seasonId,
        deviceId: 'device-one',
        latitude: 91,
        longitude: location.longitude,
      }),
    ).toEqual({ status: 'invalid-position' });
    expect(
      await t.mutation(api.game.captureBall, {
        seasonId,
        deviceId: 'unknown-device',
        latitude: location.latitude,
        longitude: location.longitude,
        expectedBallVersion: 0,
        idempotencyKey: 'unknown-player',
      }),
    ).toEqual({ status: 'player-not-found' });
    expect(
      await t.mutation(api.game.captureBall, {
        seasonId,
        deviceId: 'device-one',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: -1,
        expectedBallVersion: 0,
        idempotencyKey: 'invalid-accuracy',
      }),
    ).toEqual({ status: 'invalid-position' });
    expect(
      await t.mutation(api.game.captureBall, {
        seasonId,
        deviceId: 'device-one',
        latitude: location.latitude,
        longitude: location.longitude,
        expectedBallVersion: 0.5,
        idempotencyKey: 'invalid-version',
      }),
    ).toMatchObject({ status: 'invalid-ball-version', ballVersion: 0 });

    await t.run((ctx) => ctx.db.patch(seasonId, { status: 'finished' }));
    expect(
      await t.mutation(api.game.joinSeason, {
        seasonId,
        deviceId: 'device-two',
        displayName: 'Pájaro Azul',
      }),
    ).toEqual({ status: 'game-not-active' });
    expect(
      await t.mutation(api.game.updatePresence, {
        seasonId,
        deviceId: 'device-one',
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    ).toEqual({ status: 'game-not-active' });
    expect(
      await t.mutation(api.game.captureBall, {
        seasonId,
        deviceId: 'device-one',
        latitude: location.latitude,
        longitude: location.longitude,
        expectedBallVersion: 0,
        idempotencyKey: 'finished-season',
      }),
    ).toEqual({ status: 'game-not-active' });
    expect(await t.query(api.game.getActiveSeason, {})).toBeNull();
    expect(
      await t.query(api.game.getPlayerSummary, { seasonId, deviceId: 'missing-device' }),
    ).toBeNull();

    await t.run((ctx) => ctx.db.delete(seasonId));
    expect(await t.query(api.game.getSeasonState, { seasonId })).toBeNull();
    expect(
      await t.mutation(api.game.updatePresence, {
        seasonId,
        deviceId: 'device-one',
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    ).toEqual({ status: 'season-not-found' });
    expect(playerId).toBeTruthy();
  });

  it('orders leaderboard ties by capture count and excludes players with no score', async () => {
    const t = convexTest(schema, modules);
    const { seasonId } = await t
      .withIdentity({ subject: 'organizer-test' })
      .mutation(api.game.createSeason, createSeasonArgs);
    const joinedAt = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert('players', {
        seasonId,
        subject: 'device-one',
        displayName: 'Pájaro Una Captura',
        score: 10,
        captures: 1,
        joinedAt,
      });
      await ctx.db.insert('players', {
        seasonId,
        subject: 'device-two',
        displayName: 'Pájaro Dos Capturas',
        score: 10,
        captures: 2,
        joinedAt,
      });
      await ctx.db.insert('players', {
        seasonId,
        subject: 'device-zero',
        displayName: 'Pájaro Sin Puntos',
        score: 0,
        captures: 20,
        joinedAt,
      });
    });

    expect(await t.query(api.leaderboard.getLeaderboard, { seasonId })).toEqual([
      { position: 1, nickname: 'Pájaro Dos Capturas', score: 10, captures: 2 },
      { position: 2, nickname: 'Pájaro Una Captura', score: 10, captures: 1 },
    ]);
  });
});
