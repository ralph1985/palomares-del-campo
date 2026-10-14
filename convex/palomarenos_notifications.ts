import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  buildApprovedPalomarenoNotification,
  buildPalomarenoNotification,
} from './palomarenos_notification_content';

const readRecipients = (): string[] =>
  (process.env.REPORT_TO ?? '')
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

const responseError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `resend-http-${response.status}`;
  } catch {
    return `resend-http-${response.status}`;
  }
};

export const notifySubmission = internalAction({
  args: { submissionId: v.id('palomarenos') },
  handler: async (ctx, { submissionId }): Promise<unknown> => {
    const submission = await ctx.runQuery(internal.palomarenos.getForNotification, {
      id: submissionId,
    });
    if (!submission) return { status: 'missing' as const };

    const claim = await ctx.runMutation(internal.palomarenos.claimNotification, {
      id: submissionId,
    });
    if (claim.status !== 'claimed') return { status: claim.status };

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const recipients = readRecipients();
    if (!apiKey || !from || recipients.length === 0) {
      await ctx.runMutation(internal.palomarenos.markNotificationFailed, {
        id: submissionId,
        error: 'resend-config-missing',
      });
      return { status: 'failed' as const };
    }

    const notification = buildPalomarenoNotification({
      id: submission._id,
      displayName: submission.displayName,
      city: submission.city,
      country: submission.country,
      story: submission.story,
      contactEmail: submission.contactEmail,
    });

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `palomarenos-${submissionId}`,
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject: notification.subject,
          text: notification.text,
          html: notification.html,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const body = (await response.json()) as { id?: string };
      if (!body.id) throw new Error('resend-response-missing-id');

      await ctx.runMutation(internal.palomarenos.markNotificationSent, {
        id: submissionId,
        externalId: body.id,
      });
      return { status: 'sent' as const, externalId: body.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown-error';
      await ctx.runMutation(internal.palomarenos.markNotificationFailed, {
        id: submissionId,
        error: `resend-send-failed:${message.slice(0, 180)}`,
      });
      return { status: 'failed' as const };
    }
  },
});

export const notifyApproved = internalAction({
  args: { submissionId: v.id('palomarenos') },
  handler: async (ctx, { submissionId }): Promise<unknown> => {
    const submission = await ctx.runQuery(internal.palomarenos.getForNotification, {
      id: submissionId,
    });
    if (!submission) return { status: 'missing' as const };
    if (submission.status !== 'approved') return { status: 'not-approved' as const };

    const claim = await ctx.runMutation(internal.palomarenos.claimCreatorNotification, {
      id: submissionId,
    });
    if (claim.status !== 'claimed') return { status: claim.status };

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!apiKey || !from || !submission.contactEmail) {
      await ctx.runMutation(internal.palomarenos.markCreatorNotificationFailed, {
        id: submissionId,
        error: 'resend-config-missing',
      });
      return { status: 'failed' as const };
    }

    const notification = buildApprovedPalomarenoNotification({
      displayName: submission.displayName,
      city: submission.city,
      country: submission.country,
    });

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `palomarenos-approved-${submissionId}`,
        },
        body: JSON.stringify({
          from,
          to: [submission.contactEmail],
          subject: notification.subject,
          text: notification.text,
          html: notification.html,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const body = (await response.json()) as { id?: string };
      if (!body.id) throw new Error('resend-response-missing-id');

      await ctx.runMutation(internal.palomarenos.markCreatorNotificationSent, {
        id: submissionId,
        externalId: body.id,
      });
      return { status: 'sent' as const, externalId: body.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown-error';
      await ctx.runMutation(internal.palomarenos.markCreatorNotificationFailed, {
        id: submissionId,
        error: `resend-send-failed:${message.slice(0, 180)}`,
      });
      return { status: 'failed' as const };
    }
  },
});
