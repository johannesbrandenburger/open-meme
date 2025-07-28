import { GenericMutationCtx } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { VOTE_TIME, ROUND_STATS_TIME, CREATION_TIME, FINAL_STATS_TIME } from "./games";

export const tickWrapper = internalMutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const again = await tickOneGame(ctx, args.gameId);
    if (again) ctx.scheduler.runAfter(1000, internal.gameticker.tickWrapper, args);
  }
});

export const tickOneGame = async (ctx: GenericMutationCtx<DataModel>, gameId: Id<"games">) => {
  const game = await ctx.db.get(gameId);
  if (!game) {
    throw new Error("Game not found");
  }
  const memesOfCurrentRound = await ctx.db.query("memes")
    .withIndex("by_game_round", (q) => q
      .eq("gameId", game._id)
      .eq("round", game.currentRound))
    .collect(); // TODO: check if the order has to be specified (because we index it later)

  if (game.status === "waiting") return true; // Skip waiting games

  // Check if the game has time left
  if (game.timeLeft <= 0) {
    if (game.status === "creating") {
      // Move to voting phase
      const submittedMemes = memesOfCurrentRound.filter(meme => meme.isSubmitted);
      const votingMemes = submittedMemes.sort(() => 0.5 - Math.random()).map(meme => meme._id);
      await ctx.db.patch(game._id, {
        status: "voting",
        timeLeft: VOTE_TIME,
        votingMemeNo: 1,
        votingMemes: votingMemes,
      });
    }

    else if (game.status === "voting") {

      if (game.votingMemeNo < game.players.length) {
        // Move to next meme voting phase
        await ctx.db.patch(game._id, {
          timeLeft: VOTE_TIME,
          votingMemeNo: game.votingMemeNo + 1,
        });
      }

      else {
        // Move to round stats phase
        await ctx.db.patch(game._id, {
          status: "round_stats",
          timeLeft: ROUND_STATS_TIME,
        });
      }

    }

    else if (game.status === "round_stats") {

      if (game.currentRound < game.totalRounds) {
        // Move to next round
        await ctx.db.patch(game._id, {
          status: "creating",
          timeLeft: CREATION_TIME,
          currentRound: game.currentRound + 1,
        });
      }

      else {
        // Move to final stats phase
        await ctx.db.patch(game._id, {
          status: "final_stats",
          timeLeft: FINAL_STATS_TIME,
        });
      }
    }

    else if (game.status === "final_stats") {
      // delete the game
      await ctx.db.delete(game._id);
      return false; // Indicate that the game was deleted
    }

  } else {

    // Decrease time left
    await ctx.db.patch(game._id, {
      timeLeft: game.timeLeft - 1,
    });
  }
  return true; // Indicate that the game is still active
}


export const tickGames = internalMutation({
  handler: async (ctx) => {

    // We can query all games since inactive games will be deleted
    const games = await ctx.db.query("games").collect();

    await Promise.all(games.map(async (game) => {
      await tickOneGame(ctx, game._id);
    }));
  }
})