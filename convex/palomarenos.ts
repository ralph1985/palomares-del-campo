import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action, internalMutation, internalQuery, query } from './_generated/server';
import {
  isAcceptedTurnstileVerification,
  parseTurnstileHostnames,
  verifyTurnstileToken,
} from './turnstile';
import {
  isSubmissionRateLimited,
  normalizePalomarenoSubmission,
  SUBMISSION_RATE_WINDOW_MS,
} from './palomarenos_validation';

export type PalomarenoRecord = {
  _id: string;
  _creationTime?: number;
  displayName: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  story: string;
  contactEmail: string;
  contactEmailKey?: string;
  consentGivenAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  notificationStatus: 'pending' | 'sending' | 'sent' | 'failed';
  createdAt: number;
  reviewedAt?: number;
  reviewNote?: string;
  notifiedAt?: number;
  notificationError?: string;
  notificationExternalId?: string;
  creatorNotificationStatus?: 'pending' | 'sending' | 'sent' | 'failed';
  creatorNotifiedAt?: number;
  creatorNotificationError?: string;
  creatorNotificationExternalId?: string;
};

export type PublicPalomareno = {
  id: string;
  displayName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  story: string;
};

const isValidCoordinate = (latitude: number | undefined, longitude: number | undefined): boolean =>
  latitude !== undefined &&
  longitude !== undefined &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

export const toPublicPalomareno = (record: PalomarenoRecord): PublicPalomareno | null => {
  if (record.status !== 'approved') {
    return null;
  }
  if (!isValidCoordinate(record.latitude, record.longitude)) {
    return null;
  }
  if (record.latitude === undefined || record.longitude === undefined) {
    return null;
  }

  return {
    id: record._id,
    displayName: record.displayName,
    city: record.city,
    country: record.country,
    latitude: record.latitude,
    longitude: record.longitude,
    story: record.story,
  };
};

export const createSubmission = internalMutation({
  args: {
    displayName: v.string(),
    city: v.string(),
    country: v.string(),
    story: v.string(),
    contactEmail: v.string(),
    consent: v.boolean(),
    website: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pendingRecord = normalizePalomarenoSubmission(args, now);
    const recentSubmissions = await ctx.db
      .query('palomarenos')
      .withIndex('by_contact_email_created', (index) =>
        index
          .eq('contactEmailKey', pendingRecord.contactEmailKey)
          .gt('createdAt', now - SUBMISSION_RATE_WINDOW_MS),
      )
      .collect();
    if (isSubmissionRateLimited(recentSubmissions.length)) {
      throw new Error('submission-rate-limited');
    }

    const submissionId = await ctx.db.insert('palomarenos', pendingRecord);
    await ctx.scheduler.runAfter(0, internal.palomarenos_notifications.notifySubmission, {
      submissionId,
    });

    return {
      status: 'submitted' as const,
      submissionId,
      message: 'Tu propuesta queda pendiente de revisión.',
    };
  },
});

export const submitWithTurnstile = action({
  args: {
    displayName: v.string(),
    city: v.string(),
    country: v.string(),
    story: v.string(),
    contactEmail: v.string(),
    consent: v.boolean(),
    website: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    turnstileToken: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    if (!args.turnstileToken.trim()) throw new Error('turnstile-token-missing');

    const secret = process.env.TURNSTILE_SECRET_KEY;
    const allowedHostnames = parseTurnstileHostnames(process.env.TURNSTILE_ALLOWED_HOSTNAMES);
    if (!secret || allowedHostnames.length === 0) {
      throw new Error('turnstile-not-configured');
    }

    let verification;
    try {
      verification = await verifyTurnstileToken(args.turnstileToken, secret);
    } catch {
      throw new Error('turnstile-provider-unavailable');
    }

    if (
      !isAcceptedTurnstileVerification(verification, {
        allowedHostnames,
        expectedAction: process.env.TURNSTILE_EXPECTED_ACTION?.trim() || undefined,
      })
    ) {
      throw new Error('turnstile-invalid');
    }

    return ctx.runMutation(internal.palomarenos.createSubmission, {
      displayName: args.displayName,
      city: args.city,
      country: args.country,
      story: args.story,
      contactEmail: args.contactEmail,
      consent: args.consent,
      website: args.website,
      latitude: args.latitude,
      longitude: args.longitude,
    });
  },
});

export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db
      .query('palomarenos')
      .withIndex('by_status_created', (index) => index.eq('status', 'approved'))
      .collect();

    return records.flatMap((record) => {
      const publicRecord = toPublicPalomareno(record);
      return publicRecord ? [publicRecord] : [];
    });
  },
});

export const getForNotification = internalQuery({
  args: { id: v.id('palomarenos') },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listPending = internalQuery({
  args: {},
  handler: async (ctx) =>
    ctx.db
      .query('palomarenos')
      .withIndex('by_status_created', (index) => index.eq('status', 'pending'))
      .collect(),
});

export const claimNotification = internalMutation({
  args: { id: v.id('palomarenos') },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return { status: 'missing' as const };
    if (record.notificationStatus === 'sent' || record.notificationStatus === 'sending') {
      return { status: 'skipped' as const };
    }

    await ctx.db.patch(args.id, {
      notificationStatus: 'sending',
      notificationError: undefined,
    });
    return { status: 'claimed' as const };
  },
});

export const markNotificationSent = internalMutation({
  args: {
    id: v.id('palomarenos'),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return { status: 'missing' as const };
    if (record.notificationStatus === 'sent') return { status: 'sent' as const };

    const notifiedAt = Date.now();
    await ctx.db.patch(args.id, {
      notificationStatus: 'sent',
      notifiedAt,
      notificationError: undefined,
      notificationExternalId: args.externalId,
    });
    return { status: 'sent' as const, notifiedAt };
  },
});

export const markNotificationFailed = internalMutation({
  args: {
    id: v.id('palomarenos'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return { status: 'missing' as const };

    await ctx.db.patch(args.id, {
      notificationStatus: 'failed',
      notificationError: args.error.slice(0, 240),
    });
    return { status: 'failed' as const };
  },
});

export const getCreatorNotificationStatus = internalQuery({
  args: { id: v.id('palomarenos') },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return null;
    return {
      status: record.creatorNotificationStatus ?? 'pending',
      notifiedAt: record.creatorNotifiedAt,
      externalId: record.creatorNotificationExternalId,
      error: record.creatorNotificationError,
    };
  },
});

export const claimCreatorNotification = internalMutation({
  args: { id: v.id('palomarenos') },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return { status: 'missing' as const };
    if (record.status !== 'approved') return { status: 'not-approved' as const };
    if (
      record.creatorNotificationStatus === 'sent' ||
      record.creatorNotificationStatus === 'sending'
    ) {
      return { status: 'skipped' as const };
    }

    await ctx.db.patch(args.id, {
      creatorNotificationStatus: 'sending',
      creatorNotificationError: undefined,
    });
    return { status: 'claimed' as const };
  },
});

export const markCreatorNotificationSent = internalMutation({
  args: {
    id: v.id('palomarenos'),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return { status: 'missing' as const };
    if (record.creatorNotificationStatus === 'sent') return { status: 'sent' as const };

    const creatorNotifiedAt = Date.now();
    await ctx.db.patch(args.id, {
      creatorNotificationStatus: 'sent',
      creatorNotifiedAt,
      creatorNotificationError: undefined,
      creatorNotificationExternalId: args.externalId,
    });
    return { status: 'sent' as const, creatorNotifiedAt };
  },
});

export const markCreatorNotificationFailed = internalMutation({
  args: {
    id: v.id('palomarenos'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) return { status: 'missing' as const };

    await ctx.db.patch(args.id, {
      creatorNotificationStatus: 'failed',
      creatorNotificationError: args.error.slice(0, 240),
    });
    return { status: 'failed' as const };
  },
});

export const reject = internalMutation({
  args: {
    id: v.id('palomarenos'),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    if (!record) throw new Error('palomareno-not-found');
    if (record.status === 'withdrawn') throw new Error('palomareno-withdrawn');

    const reviewedAt = Date.now();
    await ctx.db.patch(args.id, {
      status: 'rejected',
      reviewedAt,
      reviewNote: args.reviewNote,
    });
    return { status: 'rejected' as const, reviewedAt };
  },
});
export const approve = internalMutation({
  args: {
    id: v.id('palomarenos'),
    latitude: v.number(),
    longitude: v.number(),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isValidCoordinate(args.latitude, args.longitude)) {
      throw new Error('invalid-review-coordinate');
    }

    const record = await ctx.db.get(args.id);
    if (!record) throw new Error('palomareno-not-found');
    if (record.status === 'withdrawn') throw new Error('palomareno-withdrawn');

    const reviewedAt = Date.now();
    await ctx.db.patch(args.id, {
      latitude: args.latitude,
      longitude: args.longitude,
      status: 'approved',
      reviewedAt,
      reviewNote: args.reviewNote,
    });
    await ctx.scheduler.runAfter(0, internal.palomarenos_notifications.notifyApproved, {
      submissionId: args.id,
    });

    return { status: 'approved' as const, reviewedAt };
  },
});
