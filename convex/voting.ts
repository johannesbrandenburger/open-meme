import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { RESULTS_TIME } from "./games";
import { internal } from "./_generated/api";

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

    // NEW: Check if all eligible voters have voted on this meme and advance early if so
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (game && game.status === "voting" && game.votingMemeIndex !== undefined && meme) {
      // Get sorted memes (consistent with getGameState)
      let memes = await ctx.db
        .query("memes")
        .withIndex("by_game_and_round", (q) =>
          q.eq("gameId", args.gameId).eq("round", game.currentRound)
        )
        .collect();
      memes.sort((a, b) => a._creationTime - b._creationTime);

      const currentMeme = memes[game.votingMemeIndex];
      if (currentMeme._id !== args.memeId) {
        return { success: true }; // Not the current meme - ignore for progression
      }

      // Count votes for this meme
      const roundVotes = await ctx.db
        .query("votes")
        .withIndex("by_game_round", (q) =>
          q.eq("gameId", args.gameId).eq("round", args.round)
        )
        .collect();
      const memeVotes = roundVotes.filter((v) => v.memeId === args.memeId);

      // Eligible voters: all players except meme creator
      const players = await ctx.db
        .query("players")
        .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
        .collect();
      const eligibleVoters = players.filter((p) => p.playerId !== meme.playerId).length;

      if (memeVotes.length >= eligibleVoters) {
        // All voted - advance (duplicated from progressVotingMeme)
        const now = Date.now();
        const nextMemeIndex = game.votingMemeIndex + 1;

        if (nextMemeIndex < memes.length) {
          // Move to next meme
          await ctx.db.patch(game._id, {
            votingMemeIndex: nextMemeIndex,
          });
        } else {
          // All memes voted on, move to results
          const resultsEndTime = now + RESULTS_TIME;
          await ctx.db.patch(game._id, {
            status: "results",
            votingMemeIndex: undefined,
            phaseEndTime: resultsEndTime,
            lastProgressTime: now,
          });

          await ctx.scheduler.runAfter(RESULTS_TIME, internal.games.autoProgressGame, {
            gameId: args.gameId,
            expectedPhaseEndTime: resultsEndTime,
          });
        }
      }
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
