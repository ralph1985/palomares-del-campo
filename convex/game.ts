import { v } from 'convex/values';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { evaluateServerCapture } from './geo';
import { normalizeNickname } from './identity';

const locationValidator = v.object({
  locationId: v.string(),
  name: v.string(),
  latitude: v.number(),
  longitude: v.number(),
  radiusMeters: v.number(),
});

const getIdentitySubject = async (ctx: QueryCtx | MutationCtx): Promise<string> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error('auth-required');
  return identity.subject;
};

const readBallState = async (ctx: QueryCtx | MutationCtx, seasonId: Id<'seasons'>) => {
  return ctx.db
    .query('ballState')
    .withIndex('by_season', (query) => query.eq('seasonId', seasonId))
    .unique();
};

const readSeasonState = async (ctx: QueryCtx | MutationCtx, seasonId: Id<'seasons'>) => {
  const season = await ctx.db.get(seasonId);
  if (!season) return null;

  const ball = await readBallState(ctx, seasonId);
  if (!ball) return null;

  const location = await ctx.db.get(ball.locationId);
  if (!location) return null;

  const players = await ctx.db
    .query('players')
    .withIndex('by_season_subject', (query) => query.eq('seasonId', seasonId))
    .collect();

  return {
    season: {
      id: season._id,
      slug: season.slug,
      name: season.name,
      status: season.status,
      capturePoints: season.capturePoints,
    },
    ball: {
      version: ball.version,
      locationId: location.locationId,
      locationName: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMeters: location.radiusMeters,
    },
    playerCount: players.length,
  };
};

export const createSeason = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    locations: v.array(locationValidator),
  },
  handler: async (ctx, args) => {
    const ownerSubject = await getIdentitySubject(ctx);
    if (args.locations.length === 0) throw new Error('locations-required');

    const locationIds = new Set<string>();
    for (const location of args.locations) {
      if (locationIds.has(location.locationId)) throw new Error('duplicate-location-id');
      if (!Number.isFinite(location.radiusMeters) || location.radiusMeters <= 0) {
        throw new Error('invalid-location-radius');
      }
      locationIds.add(location.locationId);
    }

    const existingSeason = await ctx.db
      .query('seasons')
      .withIndex('by_slug', (query) => query.eq('slug', args.slug))
      .unique();
    if (existingSeason) throw new Error('season-slug-already-exists');

    const activeSeason = await ctx.db
      .query('seasons')
      .withIndex('by_status', (query) => query.eq('status', 'active'))
      .first();
    if (activeSeason) throw new Error('active-season-exists');

    const now = Date.now();
    const seasonId = await ctx.db.insert('seasons', {
      slug: args.slug,
      name: args.name,
      status: 'active',
      capturePoints: 10,
      ownerSubject,
      createdAt: now,
    });

    const locations = [];
    for (const [sortOrder, location] of args.locations.entries()) {
      locations.push(
        await ctx.db.insert('locations', {
          seasonId,
          ...location,
          sortOrder,
        }),
      );
    }

    await ctx.db.insert('ballState', {
      seasonId,
      locationId: locations[0],
      version: 0,
      updatedAt: now,
    });

    return { seasonId, status: 'active' as const, ballVersion: 0 };
  },
});

export const joinSeason = mutation({
  args: {
    seasonId: v.id('seasons'),
    deviceId: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season) return { status: 'season-not-found' as const };
    if (season.status !== 'active') return { status: 'game-not-active' as const };

    const nickname = normalizeNickname(args.displayName);
    const existingPlayer = await ctx.db
      .query('players')
      .withIndex('by_season_subject', (query) =>
        query.eq('seasonId', args.seasonId).eq('subject', args.deviceId),
      )
      .unique();
    const existingNickname = await ctx.db
      .query('players')
      .withIndex('by_season_nickname', (query) =>
        query.eq('seasonId', args.seasonId).eq('nicknameKey', nickname.nicknameKey),
      )
      .unique();

    if (existingNickname && existingNickname._id !== existingPlayer?._id) {
      return { status: 'nickname-taken' as const };
    }

    if (existingPlayer) {
      const nicknameChanged = existingPlayer.nicknameKey !== nickname.nicknameKey;
      await ctx.db.patch(existingPlayer._id, {
        displayName: nickname.displayName,
        nicknameKey: nickname.nicknameKey,
        ...(nicknameChanged ? { score: 0, captures: 0, lastCaptureAt: undefined } : {}),
      });
      return {
        status: 'joined' as const,
        playerId: existingPlayer._id,
        returning: !nicknameChanged,
        progressReset: nicknameChanged,
      };
    }

    const playerId = await ctx.db.insert('players', {
      seasonId: args.seasonId,
      subject: args.deviceId,
      displayName: nickname.displayName,
      nicknameKey: nickname.nicknameKey,
      score: 0,
      captures: 0,
      joinedAt: Date.now(),
    });

    return { status: 'joined' as const, playerId, returning: false, progressReset: false };
  },
});

export const getSeasonState = query({
  args: { seasonId: v.id('seasons') },
  handler: async (ctx, args) => readSeasonState(ctx, args.seasonId),
});

export const getActiveSeason = query({
  args: {},
  handler: async (ctx) => {
    const season = await ctx.db
      .query('seasons')
      .withIndex('by_status', (query) => query.eq('status', 'active'))
      .first();
    return season ? readSeasonState(ctx, season._id) : null;
  },
});

export const captureBall = mutation({
  args: {
    seasonId: v.id('seasons'),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
    expectedBallVersion: v.number(),
    idempotencyKey: v.string(),
    deviceId: v.string(),
  },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season) return { status: 'season-not-found' as const };

    const player = await ctx.db
      .query('players')
      .withIndex('by_season_subject', (query) =>
        query.eq('seasonId', args.seasonId).eq('subject', args.deviceId),
      )
      .unique();
    if (!player) return { status: 'player-not-found' as const };

    const requestFingerprint = JSON.stringify({
      subject: args.deviceId,
      latitude: args.latitude,
      longitude: args.longitude,
      accuracy: args.accuracy ?? null,
      expectedBallVersion: args.expectedBallVersion,
    });
    const previousCapture = await ctx.db
      .query('captures')
      .withIndex('by_season_idempotency', (query) =>
        query.eq('seasonId', args.seasonId).eq('idempotencyKey', args.idempotencyKey),
      )
      .unique();

    const ball = await readBallState(ctx, args.seasonId);
    if (!ball) return { status: 'location-not-found' as const };

    if (previousCapture) {
      if (previousCapture.requestFingerprint !== requestFingerprint) {
        return { status: 'idempotency-conflict' as const, ballVersion: ball.version };
      }
      return {
        status: 'accepted' as const,
        duplicate: true,
        points: previousCapture.points,
        score: player.score,
        ballVersion: ball.version,
      };
    }

    if (season.status !== 'active') return { status: 'game-not-active' as const };
    if (!Number.isInteger(args.expectedBallVersion) || args.expectedBallVersion < 0) {
      return { status: 'invalid-ball-version' as const, ballVersion: ball.version };
    }
    if (args.expectedBallVersion !== ball.version) {
      return { status: 'stale-ball' as const, ballVersion: ball.version };
    }

    const location = await ctx.db.get(ball.locationId);
    if (!location) return { status: 'location-not-found' as const };

    const evaluation = evaluateServerCapture(
      { latitude: args.latitude, longitude: args.longitude, accuracy: args.accuracy },
      location,
    );
    if (evaluation.reason === 'low-accuracy') {
      return { status: 'low-accuracy' as const, distanceMeters: evaluation.distanceMeters };
    }
    if (!evaluation.eligible) {
      return { status: 'outside-radius' as const, distanceMeters: evaluation.distanceMeters };
    }

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_season_sort', (query) => query.eq('seasonId', args.seasonId))
      .collect();
    const currentIndex = locations.findIndex((candidate) => candidate._id === location._id);
    const nextLocation = locations[(currentIndex + 1) % locations.length];
    const now = Date.now();

    await ctx.db.insert('captures', {
      seasonId: args.seasonId,
      playerId: player._id,
      idempotencyKey: args.idempotencyKey,
      requestFingerprint,
      locationId: location._id,
      expectedBallVersion: ball.version,
      points: season.capturePoints,
      distanceMeters: evaluation.distanceMeters,
      ...(args.accuracy === undefined ? {} : { accuracyMeters: args.accuracy }),
      createdAt: now,
    });
    await ctx.db.patch(player._id, {
      score: player.score + season.capturePoints,
      captures: player.captures + 1,
      lastCaptureAt: now,
    });
    await ctx.db.patch(ball._id, {
      locationId: nextLocation._id,
      version: ball.version + 1,
      updatedAt: now,
    });

    return {
      status: 'accepted' as const,
      duplicate: false,
      points: season.capturePoints,
      score: player.score + season.capturePoints,
      ballVersion: ball.version + 1,
      activeLocationId: nextLocation.locationId,
    };
  },
});
