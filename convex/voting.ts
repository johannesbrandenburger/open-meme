import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ROUND_STATS_TIME, VOTE_TIME } from "./games";


export const userVote = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");
    const { gameId } = args;
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    if (!game.players.includes(userId)) {
      throw new Error("You are not a player in this game");
    }

    const round = game.currentRound;
    const currentVotingMeme = game.votingMemes[game.votingMemeNo - 1];

    const vote = await ctx.db.query("votes")
      .withIndex("by_game_round_user_meme", (q) => q
        .eq("gameId", gameId)
        .eq("round", round)
        .eq("userId", userId)
        .eq("memeId", currentVotingMeme))
      .first();
    return vote;
  }
});

export const submitVote = mutation({
  args: {
    gameId: v.id("games"),
    round: v.number(),
    memeId: v.id("memes"),
    score: v.union(v.literal(1), v.literal(-1), v.literal(0)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { gameId, round, memeId, score } = args;

    // Check if user is a player in the game
    const game = await ctx.db.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (!game.players.includes(userId)) {
      throw new Error("You are not a player in this game");
    }

    // Check if the user has already voted in this round
    const existingVote = await ctx.db.query("votes")
      .withIndex("by_game_round_user", (q) => q
        .eq("gameId", gameId)
        .eq("round", round)
        .eq("userId", userId))
      .first();

    if (existingVote) {
      throw new Error("You have already voted in this round");
    }

    // Insert the new vote
    await ctx.db.insert("votes", {
      userId,
      gameId,
      round,
      memeId,
      score,
      createdAt: Date.now(),
    });

    // Check if all players have voted
    const votes = await ctx.db.query("votes")
      .withIndex("by_game_round", (q) => q
        .eq("gameId", gameId)
        .eq("round", round))
      .collect();

    if (votes.length === game.players.length - 1) { // -1 because the owner doesn't vote

      if (game.votingMemeNo < game.players.length) {
        // Move to next meme voting phase
        await ctx.db.patch(game._id, {
          timeLeft: VOTE_TIME,
          votingMemeNo: game.votingMemeNo + 1,
        });
      } else {
        // Move to round stats phase
        await ctx.db.patch(game._id, {
          status: "round_stats",
          timeLeft: ROUND_STATS_TIME,
        });
      }
    }
  }
});