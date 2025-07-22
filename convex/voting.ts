import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const submitVote = mutation({
  args: {
    gameId: v.string(),
    round: v.number(),
    voterId: v.string(),
    memeId: v.id("memes"),
    vote: v.union(v.literal(1), v.literal(-1), v.literal(0)),
  },
  handler: async (ctx, args) => {
    // Check if voter already voted on this meme
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_voter_meme", (q) =>
        q.eq("voterId", args.voterId).eq("memeId", args.memeId)
      )
      .first();

    if (existingVote) {
      throw new Error("Already voted on this meme");
    }

    // Check if trying to vote on own meme
    const meme = await ctx.db.get(args.memeId);
    if (meme?.playerId === args.voterId) {
      throw new Error("Cannot vote on your own meme");
    }

    // Submit vote
    await ctx.db.insert("votes", {
      gameId: args.gameId,
      round: args.round,
      voterId: args.voterId,
      memeId: args.memeId,
      vote: args.vote,
      createdAt: Date.now(),
    });

    // Update meme score
    if (meme) {
      await ctx.db.patch(meme._id, {
        score: meme.score + args.vote,
      });
    }

    return { success: true };
  },
});

export const getVotesForRound = query({
  args: {
    gameId: v.string(),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .withIndex("by_game_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", args.round)
      )
      .collect();
  },
});

export const hasVoted = query({
  args: {
    voterId: v.string(),
    memeId: v.id("memes"),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("votes")
      .withIndex("by_voter_meme", (q) =>
        q.eq("voterId", args.voterId).eq("memeId", args.memeId)
      )
      .first();

    return vote !== null;
  },
});
