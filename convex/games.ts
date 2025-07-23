import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

import templatesJson from "./templates.json";

const MEMES_PER_ROUND = 5; // Number of memes per round
const ROUNDS = 3; // Total number of rounds in a game

// Type for template from JSON
type Template = {
  name: string;
  imgUrl: string;
  source: string | null;
  text: Array<{
    style: string;
    color: string;
    font: string;
    anchor_x: number;
    anchor_y: number;
    angle: number;
    scale_x: number;
    scale_y: number;
    align: string;
    start: number;
    stop: number;
  }>;
  example: string[];
};

// Type for meme with template data
type MemeWithTemplate = {
  _id: Id<"memes">;
  _creationTime: number;
  gameId: string;
  playerId: string;
  round: number;
  templateName: string;
  texts: string[];
  score: number;
  submitted: boolean;
  createdAt: number;
  template?: Template;
};

// Generate a random game ID
function generateGameId(): string {
  return Math.random().toString(36).substring(2, 8);
}

export const createGame = mutation({
  args: {
    hostId: v.string(),
    nickname: v.string(),
  },
  returns: v.object({ gameId: v.string() }),
  handler: async (ctx, args) => {
    const gameId = generateGameId();

    // Create the game
    await ctx.db.insert("games", {
      gameId,
      hostId: args.hostId,
      status: "waiting",
      currentRound: 0,
      totalRounds: ROUNDS,
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

    // Generate initial templates for the host
    const playerTemplates = generateTemplates(gameId, args.hostId);
    for (const template of playerTemplates) {
      await ctx.db.insert("gameTemplates", template);
    }

    return { gameId };
  },
});

export const joinGame = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    nickname: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Check if game exists
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status === "finished") {
      throw new Error("Game has finished");
    }

    // Check if player already joined
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingPlayer) {
      // Player already exists - just update nickname if needed and return success
      if (existingPlayer.nickname !== args.nickname) {
        await ctx.db.patch(existingPlayer._id, {
          nickname: args.nickname,
        });
      }
      return { success: true };
    }

    // For new players, only allow joining if game is in waiting state
    if (game.status !== "waiting") {
      throw new Error("Cannot join - game has already started");
    }

    // Create the player templates
    // templatesJson is a big array from which we select 5 random templates
    const playerTemplates = generateTemplates(args.gameId, args.playerId);

    // Add new player to game
    await ctx.db.insert("players", {
      gameId: args.gameId,
      playerId: args.playerId,
      nickname: args.nickname,
      totalScore: 0,
      isHost: false,
      joinedAt: Date.now(),
    });

    // Add player templates
    for (const template of playerTemplates) {
      await ctx.db.insert("gameTemplates", template);
    }

    return { success: true };
  },
});

export const checkPlayerInGame = query({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("players"),
      _creationTime: v.number(),
      gameId: v.string(),
      playerId: v.string(),
      nickname: v.string(),
      totalScore: v.number(),
      isHost: v.boolean(),
      joinedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    return player || null;
  },
});

export const reconnectToGame = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    alreadyInGame: v.boolean(),
    gameStatus: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check if game exists
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    // Check if player is already in the game
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingPlayer) {
      return {
        success: true,
        alreadyInGame: true,
        gameStatus: game.status
      };
    }

    return {
      success: true,
      alreadyInGame: false,
      gameStatus: game.status
    };
  },
});

export const progressGame = mutation({
  args: { gameId: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // This is now handled automatically by the game engine
    // Just return success for backwards compatibility
    return { success: true };
  },
});


// Game timing constants
export const CREATION_TIME = 60 * 1000; // 60 seconds in milliseconds
export const VOTING_TIME_PER_MEME = 30 * 1000; // 30 seconds per meme
export const RESULTS_TIME = 10 * 1000; // 10 seconds to view results

export const getGameState = query({
  args: {
    gameId: v.string(),
    playerId: v.string()
  },
  returns: v.union(
    v.object({
      _id: v.id("games"),
      _creationTime: v.number(),
      gameId: v.string(),
      hostId: v.string(),
      status: v.union(
        v.literal("waiting"),
        v.literal("creating"),
        v.literal("voting"),
        v.literal("results"),
        v.literal("finished")
      ),
      currentRound: v.number(),
      totalRounds: v.number(),
      currentMemeIndex: v.optional(v.number()),
      phaseEndTime: v.optional(v.number()),
      votingMemeIndex: v.optional(v.number()),
      createdAt: v.number(),
      lastProgressTime: v.optional(v.number()),
      timeLeft: v.number(),
      players: v.array(v.object({
        _id: v.id("players"),
        _creationTime: v.number(),
        gameId: v.string(),
        playerId: v.string(),
        nickname: v.string(),
        totalScore: v.number(),
        isHost: v.boolean(),
        joinedAt: v.number(),
      })),
      playerTemplates: v.array(v.object({
        name: v.string(),
        imgUrl: v.string(),
        source: v.union(v.string(), v.null()),
        text: v.array(v.object({
          style: v.string(),
          color: v.string(),
          font: v.string(),
          anchor_x: v.number(),
          anchor_y: v.number(),
          angle: v.number(),
          scale_x: v.number(),
          scale_y: v.number(),
          align: v.string(),
          start: v.number(),
          stop: v.number(),
        })),
        example: v.array(v.string()),
      })),
      currentPlayer: v.optional(v.object({
        _id: v.id("players"),
        _creationTime: v.number(),
        gameId: v.string(),
        playerId: v.string(),
        nickname: v.string(),
        totalScore: v.number(),
        isHost: v.boolean(),
        joinedAt: v.number(),
      })),
      currentRoundMemes: v.array(v.object({
        _id: v.id("memes"),
        _creationTime: v.number(),
        gameId: v.string(),
        playerId: v.string(),
        round: v.number(),
        templateName: v.string(),
        texts: v.array(v.string()),
        score: v.number(),
        submitted: v.boolean(),
        createdAt: v.number(),
        template: v.optional(v.object({
          name: v.string(),
          imgUrl: v.string(),
          source: v.union(v.string(), v.null()),
          text: v.array(v.object({
            style: v.string(),
            color: v.string(),
            font: v.string(),
            anchor_x: v.number(),
            anchor_y: v.number(),
            angle: v.number(),
            scale_x: v.number(),
            scale_y: v.number(),
            align: v.string(),
            start: v.number(),
            stop: v.number(),
          })),
          example: v.array(v.string()),
        })),
      })),
      currentVotingMeme: v.optional(v.object({
        _id: v.id("memes"),
        _creationTime: v.number(),
        gameId: v.string(),
        playerId: v.string(),
        round: v.number(),
        templateName: v.string(),
        texts: v.array(v.string()),
        score: v.number(),
        submitted: v.boolean(),
        createdAt: v.number(),
        template: v.optional(v.object({
          name: v.string(),
          imgUrl: v.string(),
          source: v.union(v.string(), v.null()),
          text: v.array(v.object({
            style: v.string(),
            color: v.string(),
            font: v.string(),
            anchor_x: v.number(),
            anchor_y: v.number(),
            angle: v.number(),
            scale_x: v.number(),
            scale_y: v.number(),
            align: v.string(),
            start: v.number(),
            stop: v.number(),
          })),
          example: v.array(v.string()),
        })),
      })),
    }),
    v.null()
  ),
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

    const currentPlayer = args.playerId
      ? players.find(p => p.playerId === args.playerId)
      : undefined;

    // Calculate time left based on server time
    let timeLeft = 0;
    if (game.phaseEndTime) {
      timeLeft = Math.max(0, Math.floor((game.phaseEndTime - Date.now()) / 1000));
    }

    // Get current round memes for voting/results screens
    let currentRoundMemes: MemeWithTemplate[] = [];
    let currentVotingMeme: MemeWithTemplate | undefined = undefined;

    // Get the templates for the current game and the player
    const playerTemplates = (await ctx.db
      .query("gameTemplates")
      .withIndex("by_game_player_round",
        (q) => q.eq("gameId", args.gameId).eq("playerId", args.playerId).eq("round", game.currentRound))
      .collect())
      .map((template) => ({
        name: template.name,
        imgUrl: template.imgUrl,
        source: template.source,
        text: template.text,
        example: template.example,
      }));

    if (game.status === "voting" || game.status === "results") {
      const memes = await ctx.db
        .query("memes")
        .withIndex("by_game_and_round", (q) =>
          q.eq("gameId", args.gameId).eq("round", game.currentRound)
        )
        .collect();

      // Enhance memes with template data and voting info
      currentRoundMemes = memes.map((meme) => {
        const template = templatesJson.find((t: any) => t.name === meme.templateName);
        return {
          ...meme,
          template,
        };
      });

      // Sort memes consistently for voting (by creation time)
      currentRoundMemes.sort((a, b) => a._creationTime - b._creationTime);

      if (game.status === "voting" && game.votingMemeIndex !== undefined) {
        currentVotingMeme = currentRoundMemes[game.votingMemeIndex];
      }
    }

    return {
      ...game,
      timeLeft,
      players,
      currentPlayer,
      currentRoundMemes,
      currentVotingMeme,
      playerTemplates: playerTemplates
    };
  },
});

export const startGame = mutation({
  args: {
    gameId: v.string(),
    hostId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
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

    const now = Date.now();
    await ctx.db.patch(game._id, {
      status: "creating",
      currentRound: 1,
      phaseEndTime: now + CREATION_TIME,
      lastProgressTime: now,
    });

    // Schedule automatic progression
    await ctx.scheduler.runAfter(CREATION_TIME, internal.games.autoProgressGame, {
      gameId: args.gameId,
      expectedPhaseEndTime: now + CREATION_TIME,
    });

    return { success: true };
  },
});

export const autoProgressGame = internalMutation({
  args: {
    gameId: v.string(),
    expectedPhaseEndTime: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game || game.status === "finished") {
      return null;
    }

    // Only progress if we're still in the expected phase
    if (game.phaseEndTime !== args.expectedPhaseEndTime) {
      return null;
    }

    const now = Date.now();

    switch (game.status) {
      case "creating":
        // Move to voting phase
        const memes = await ctx.db
          .query("memes")
          .withIndex("by_game_and_round", (q) =>
            q.eq("gameId", args.gameId).eq("round", game.currentRound)
          )
          .collect();

        if (memes.length === 0) {
          // No memes created, skip to next round or end game
          if (game.currentRound < game.totalRounds) {
            await ctx.db.patch(game._id, {
              status: "creating",
              currentRound: game.currentRound + 1,
              phaseEndTime: now + CREATION_TIME,
              lastProgressTime: now,
            });

            await ctx.scheduler.runAfter(CREATION_TIME, internal.games.autoProgressGame, {
              gameId: args.gameId,
              expectedPhaseEndTime: now + CREATION_TIME,
            });
          } else {
            await ctx.db.patch(game._id, {
              status: "finished",
              phaseEndTime: undefined,
              lastProgressTime: now,
            });
          }
          return null;
        }

        const votingEndTime = now + (VOTING_TIME_PER_MEME * memes.length);
        await ctx.db.patch(game._id, {
          status: "voting",
          votingMemeIndex: 0,
          phaseEndTime: votingEndTime,
          lastProgressTime: now,
        });

        // Schedule progression through each meme
        for (let i = 0; i < memes.length; i++) {
          const memeEndTime = now + (VOTING_TIME_PER_MEME * (i + 1));
          await ctx.scheduler.runAfter(VOTING_TIME_PER_MEME * (i + 1), internal.games.progressVotingMeme, {
            gameId: args.gameId,
            memeIndex: i,
            expectedTime: memeEndTime,
          });
        }
        break;

      case "voting":
        // Move to results phase
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
        break;

      case "results":
        // Move to next round or finish game
        if (game.currentRound < game.totalRounds) {
          const nextRoundEndTime = now + CREATION_TIME;
          await ctx.db.patch(game._id, {
            status: "creating",
            currentRound: game.currentRound + 1,
            phaseEndTime: nextRoundEndTime,
            lastProgressTime: now,
          });

          await ctx.scheduler.runAfter(CREATION_TIME, internal.games.autoProgressGame, {
            gameId: args.gameId,
            expectedPhaseEndTime: nextRoundEndTime,
          });
        } else {
          await ctx.db.patch(game._id, {
            status: "finished",
            phaseEndTime: undefined,
            lastProgressTime: now,
          });
        }
        break;
    }

    return null;
  },
});

export const progressVotingMeme = internalMutation({
  args: {
    gameId: v.string(),
    memeIndex: v.number(),
    expectedTime: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game || game.status !== "voting") {
      return null;
    }

    // Safety check to skip if we've already advanced past this meme index
    if (game.votingMemeIndex !== args.memeIndex) {
      return null;
    }

    const memes = await ctx.db
      .query("memes")
      .withIndex("by_game_and_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", game.currentRound)
      )
      .collect();

    const nextMemeIndex = args.memeIndex + 1;

    if (nextMemeIndex < memes.length) {
      // Move to next meme
      await ctx.db.patch(game._id, {
        votingMemeIndex: nextMemeIndex,
      });
    } else {
      // All memes voted on, move to results
      const now = Date.now();
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

    return null;
  },
});

// Force progress game for manual control (e.g., if all players are ready)
export const forceProgressGame = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    // Only host can force progress for now
    if (game.hostId !== args.playerId) {
      throw new Error("Only the host can force game progression");
    }

    const now = Date.now();

    // Force progress by setting phase end time to now
    await ctx.db.patch(game._id, {
      phaseEndTime: now,
      lastProgressTime: now,
    });

    // Trigger immediate progression
    await ctx.scheduler.runAfter(0, internal.games.autoProgressGame, {
      gameId: args.gameId,
      expectedPhaseEndTime: now,
    });

    return { success: true };
  },
});

function generateTemplates(gameId: string, playerId: string) {
  const shuffledTemplates = templatesJson.sort(() => 0.5 - Math.random()).slice(0, MEMES_PER_ROUND * ROUNDS);
  const playerTemplates = shuffledTemplates.map((template, index) => ({
    gameId: gameId,
    playerId: playerId,
    name: template.name,
    imgUrl: template.imgUrl,
    source: template.source,
    text: template.text,
    example: template.example,
    round: Math.floor(index / MEMES_PER_ROUND) + 1, // Assign round based on index
  }));
  return playerTemplates;
}
