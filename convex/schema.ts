import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  seasons: defineTable({
    slug: v.string(),
    name: v.string(),
    status: v.union(v.literal('active'), v.literal('finished')),
    capturePoints: v.number(),
    ownerSubject: v.string(),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_status', ['status']),
  locations: defineTable({
    seasonId: v.id('seasons'),
    locationId: v.string(),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radiusMeters: v.number(),
    sortOrder: v.number(),
  })
    .index('by_season_sort', ['seasonId', 'sortOrder'])
    .index('by_season_location', ['seasonId', 'locationId']),
  ballState: defineTable({
    seasonId: v.id('seasons'),
    locationId: v.id('locations'),
    version: v.number(),
    updatedAt: v.number(),
  }).index('by_season', ['seasonId']),
  players: defineTable({
    seasonId: v.id('seasons'),
    subject: v.string(),
    displayName: v.string(),
    nicknameKey: v.optional(v.string()),
    score: v.number(),
    captures: v.number(),
    joinedAt: v.number(),
    lastCaptureAt: v.optional(v.number()),
    presenceLatitude: v.optional(v.number()),
    presenceLongitude: v.optional(v.number()),
    presenceAt: v.optional(v.number()),
  })
    .index('by_season_subject', ['seasonId', 'subject'])
    .index('by_season_nickname', ['seasonId', 'nicknameKey']),
  captures: defineTable({
    seasonId: v.id('seasons'),
    playerId: v.id('players'),
    idempotencyKey: v.string(),
    requestFingerprint: v.string(),
    locationId: v.id('locations'),
    expectedBallVersion: v.number(),
    points: v.number(),
    distanceMeters: v.number(),
    accuracyMeters: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_season_idempotency', ['seasonId', 'idempotencyKey'])
    .index('by_season_created', ['seasonId', 'createdAt']),
  palomarenos: defineTable({
    displayName: v.string(),
    city: v.string(),
    country: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    story: v.string(),
    contactEmail: v.string(),
    consentGivenAt: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('withdrawn'),
    ),
    notificationStatus: v.union(
      v.literal('pending'),
      v.literal('sending'),
      v.literal('sent'),
      v.literal('failed'),
    ),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewNote: v.optional(v.string()),
    notifiedAt: v.optional(v.number()),
    notificationError: v.optional(v.string()),
    notificationExternalId: v.optional(v.string()),
    creatorNotificationStatus: v.optional(
      v.union(v.literal('pending'), v.literal('sending'), v.literal('sent'), v.literal('failed')),
    ),
    creatorNotifiedAt: v.optional(v.number()),
    creatorNotificationError: v.optional(v.string()),
    creatorNotificationExternalId: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_status_created', ['status', 'createdAt']),
});
