import { v } from 'convex/values';
import { query } from './_generated/server';

export const getLeaderboard = query({
  args: { seasonId: v.id('seasons') },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query('players')
      .withIndex('by_season_subject', (query) => query.eq('seasonId', args.seasonId))
      .collect();

    return players
      .filter((player) => player.score > 0)
      .sort((left, right) => right.score - left.score || right.captures - left.captures)
      .slice(0, 50)
      .map((player, index) => ({
        position: index + 1,
        nickname: player.displayName,
        score: player.score,
        captures: player.captures,
      }));
  },
});
