import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";
import templatesJson from "./templates.json";
import { getAuthUserId } from "@convex-dev/auth/server";
import { GenericMutationCtx, GenericQueryCtx } from "convex/server";


// constants
export const ROUNDS = 3; // Total number of rounds in a game
export const CREATION_TIME = 90; // Time for meme creation in seconds
export const VOTE_TIME = 20; // Time for voting in seconds (one meme)
export const ROUND_STATS_TIME = 10; // Time for round stats in seconds
export const FINAL_STATS_TIME = 10; // Time for final stats in seconds
export const MEMES_PER_ROUND = 5; // Number of memes per round the user can choose from

export const createGame = mutation({
  args: {},
  handler: async (ctx, args) => {

    // Get the authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create a new game
    const gameId = await ctx.db.insert("games", {
      hostId: userId,
      status: "waiting",
      timeLeft: 0,
      currentRound: 0,
      totalRounds: ROUNDS,
      votingMemeNo: 0,
      votingMemes: [],
      players: [userId],
      createdAt: Date.now(),
    });

    return gameId;
  }
});

export const joinGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const { gameId } = args;

    // Get the authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if the game exists or has already started
    const game = await ctx.db.get(gameId);
    if (!game) {
      return null; // Game not found
    }

    // Check if the player is already in the game
    if (game.players.includes(userId)) {
      return { success: true };
    }

    if (game.status !== "waiting") {
      throw new Error("Cannot join - game has already started");
    }

    // Add player to the game
    await ctx.db.patch(game._id, {
      players: [...game.players, userId],
    });
  }
})

export const startGame = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const { gameId } = args;

    // Get the authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if the game exists, is in the waiting state and the user is the host
    const game = await ctx.db.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Cannot start game - game is not in waiting state");
    }
    if (game.hostId !== userId) {
      throw new Error("Only the host can start the game");
    }

    // Fill the memes table with initial memes
    await Promise.all(
      game.players.map(async (playerId) => {
        await Promise.all(
          Array.from({ length: ROUNDS }).map(async (_, index) => {
            const templates = templatesJson.sort(() => 0.5 - Math.random()).slice(0, MEMES_PER_ROUND);
            const meme = {
              gameId: game._id,
              playerId: playerId,
              round: index + 1,
              templateIndex: 0, // Default index, will be updated later
              texts: templates[0]?.text?.map(_ => "") || [] as string[], // Default empty texts (can be filled with examples later)
              templates: templates,
              isSubmitted: false,
              createdAt: Date.now(),
            };
            await ctx.db.insert("memes", meme);
          }
          ));
      })
    );

    // Update game status to started
    await ctx.db.patch(game._id, {
      status: "creating",
      timeLeft: CREATION_TIME,
      currentRound: 1,
    });

    // OLD:
    // NOTE: HERE THE TICKS START
    // right now this is done with a cron job, (https://docs.convex.dev/scheduling/cron-jobs)
    // but could be moved to a Scheduled Functions approach later (https://docs.convex.dev/scheduling/scheduled-functions)
    // TODO: evaluate what is better

    // NEW:
    // Start the game tick
    ctx.runMutation(internal.gameticker.tickWrapper, { gameId });
  }

});

