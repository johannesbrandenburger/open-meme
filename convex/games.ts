import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Generate a random game ID
function generateGameId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export const createGame = mutation({
  args: {
    hostId: v.string(),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const gameId = generateGameId();
    
    // Create the game
    await ctx.db.insert("games", {
      gameId,
      hostId: args.hostId,
      status: "waiting",
      currentRound: 0,
      totalRounds: 3,
      createdAt: Date.now(),
    });

    // Add the host as a player
    await ctx.db.insert("players", {
      gameId,
      playerId: args.hostId,
      nickname: args.nickname,
      totalScore: 0,
      isHost: true,
      joinedAt: Date.now(),
    });

    return { gameId };
  },
});

export const joinGame = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if game exists and is in waiting state
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    // Check if player already joined
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingPlayer) {
      return { success: true };
    }

    // Add player to game
    await ctx.db.insert("players", {
      gameId: args.gameId,
      playerId: args.playerId,
      nickname: args.nickname,
      totalScore: 0,
      isHost: false,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

export const startGame = mutation({
  args: {
    gameId: v.string(),
    hostId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.hostId !== args.hostId) {
      throw new Error("Only the host can start the game");
    }

    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    // Update game status to creating (first round)
    await ctx.db.patch(game._id, {
      status: "creating",
      currentRound: 1,
      timeLeft: 60, // 60 seconds for meme creation
    });

    return { success: true };
  },
});

export const progressGame = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) return { success: false };

    if (game.status === "voting") {
      await ctx.db.patch(game._id, { status: "results", timeLeft: 10 });
    } else if (game.status === "results") {
      if (game.currentRound < game.totalRounds) {
        await ctx.db.patch(game._id, {
          status: "creating",
          currentRound: game.currentRound + 1,
          timeLeft: 60,
        });
      } else {
        await ctx.db.patch(game._id, { status: "finished" });
      }
    }

    return { success: true };
  },
});

export const getGame = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      return null;
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      ...game,
      players,
    };
  },
});

export const getGameForPlayer = query({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      return null;
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .collect();

    const currentPlayer = players.find(p => p.playerId === args.playerId);

    if (!currentPlayer) {
      return null;
    }

    // Get current round memes for voting screen
    let currentRoundMemes: any[] = [];
    if (game.status === "voting" || game.status === "results") {
      currentRoundMemes = await ctx.db
        .query("memes")
        .withIndex("by_game_and_round", (q) => 
          q.eq("gameId", args.gameId).eq("round", game.currentRound)
        )
        .collect();
    }

    return {
      ...game,
      players,
      currentPlayer,
      currentRoundMemes,
    };
  },
});
