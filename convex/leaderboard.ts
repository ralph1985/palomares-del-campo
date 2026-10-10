import { v } from 'convex/values';
import { query } from './_generated/server';
import { effectiveScore } from './score';

export const getLeaderboard = query({
  args: { seasonId: v.id('seasons') },
  handler: async (ctx, args) => {
    const now = Date.now();
    const players = await ctx.db
      .query('players')
      .withIndex('by_season_subject', (query) => query.eq('seasonId', args.seasonId))
      .collect();

    return players
      .map((player) => ({ player, score: effectiveScore(player.score, player.lastCaptureAt, now) }))
      .filter(({ score }) => score > 0)
      .sort(
        (left, right) => right.score - left.score || right.player.captures - left.player.captures,
      )
      .slice(0, 50)
      .map(({ player, score }, index) => ({
        position: index + 1,
        nickname: player.displayName,
        score,
        captures: player.captures,
      }));
  },
});
