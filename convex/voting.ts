import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    if (!currentVotingMeme) {
      return null;
    }

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
    if (game.status !== "voting") {
      throw new Error("Game is not accepting votes");
    }
    if (round !== game.currentRound) {
      throw new Error("Vote is not for the current round");
    }
    if (memeId !== game.votingMemes[game.votingMemeNo - 1]) {
      throw new Error("Vote is not for the current meme");
    }

    const meme = await ctx.db.get(memeId);
    if (!meme) {
      throw new Error("Meme not found");
    }
    if (meme.gameId !== gameId || meme.round !== game.currentRound) {
      throw new Error("Meme is not part of the current vote");
    }
    if (meme.playerId === userId) {
      throw new Error("You cannot vote on your own meme");
    }

    // Check if the user has already voted in this round
    const existingVote = await ctx.db.query("votes")
      .withIndex("by_game_round_user_meme", (q) => q
        .eq("gameId", gameId)
        .eq("round", round)
        .eq("userId", userId)
        .eq("memeId", memeId)
      )
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
      .withIndex("by_game_round_meme", (q) => q
        .eq("gameId", gameId)
        .eq("round", round)
        .eq("memeId", memeId)
      )
      .collect();

    const expectedVotes = game.players.filter((playerId) => playerId !== meme.playerId).length;
    if (votes.length === expectedVotes) {

      if (game.votingMemeNo < game.votingMemes.length) {
        // Move to next meme voting phase
        await ctx.db.patch(game._id, {
          timeLeft: game.config.voteTime,
          votingMemeNo: game.votingMemeNo + 1,
        });
      } else {
        // Move to round stats phase
        await ctx.db.patch(game._id, {
          status: "round_stats",
          timeLeft: game.config.roundStatsTime,
        });
      }
    }
  }
});
