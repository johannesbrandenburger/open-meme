import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import templatesJson from "./templates.json";
import { getAuthUserId } from "@convex-dev/auth/server";


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
    const game = await ctx.db.insert("games", {
      hostId: userId,
      status: "waiting",
      timeLeft: 0,
      currentRound: 0,
      totalRounds: ROUNDS,
      votingMemeNo: 0,
      players: [userId],
      createdAt: Date.now(),
    });
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
      throw new Error("Game not found");
    }
    if (game.status !== "waiting") {
      throw new Error("Cannot join - game has already started");
    }

    // Check if the player is already in the game
    if (game.players.includes(userId)) {
      return { success: true };
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
            const templates = templatesJson.sort(() => 0.5 - Math.random()).slice(0, MEMES_PER_ROUND * ROUNDS);
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

    // NOTE: HERE THE TICKS START
    // right now this is done with a cron job, (https://docs.convex.dev/scheduling/cron-jobs)
    // but could be moved to a Scheduled Functions approach later (https://docs.convex.dev/scheduling/scheduled-functions)
  }

});


export const tickGames = internalMutation({
  handler: async (ctx) => {

    // We can query all games since inactive games will be deleted
    const games = await ctx.db.query("games").collect();
    
    await Promise.all(games.map(async (game) => {
      const memesOfCurrentRound = await ctx.db.query("memes")
        .withIndex("by_game_round", (q) => q
          .eq("gameId", game._id)
          .eq("round", game.currentRound))
        .collect(); // TODO: check if the order has to be specified (because we index it later)

      if (game.status === "waiting") return; // Skip waiting games

      // Check if the game has time left
      if (game.timeLeft <= 0) {
        if (game.status === "creating") {
          // Move to voting phase
          await ctx.db.patch(game._id, {
            status: "voting",
            timeLeft: VOTE_TIME,
            votingMemeNo: 1,
            votingMemeId: memesOfCurrentRound[0]?._id, // Start with the first meme
          });
        }

        else if (game.status === "voting") {

          if (game.votingMemeNo < game.players.length) {
            // Move to next meme voting phase
            await ctx.db.patch(game._id, {
              timeLeft: VOTE_TIME,
              votingMemeNo: game.votingMemeNo + 1,
              votingMemeId: memesOfCurrentRound[game.votingMemeNo]?._id, // Get the next meme
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
        }

      } else {

        // Decrease time left
        await ctx.db.patch(game._id, {
          timeLeft: game.timeLeft - 1,
        });
      }
    }));
  }
})


export const getGameStateForPlayer = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { gameId } = args;
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    // Check if the user is part of the game
    if (!game.players.includes(userId)) {
      throw new Error("You are not part of this game");
    }

    // if is voting, provide the current meme for the user
    let currentVotingMeme = null;
    let isVotingOnOwnMeme = false;
    if (game.status === "voting" && game.votingMemeId) {
      currentVotingMeme = await ctx.db.get(game.votingMemeId);
      if (!currentVotingMeme) {
        throw new Error("Voting meme not found");
      }

      // Check if the user is voting on their own meme
      isVotingOnOwnMeme = currentVotingMeme.playerId === userId;
    }

    return {
      ...game,
      currentPlayer: userId,
      currentVotingMeme,
      isVotingOnOwnMeme,
    };
  }
});

export const getRoundStats = query({
  args: {
    gameId: v.id("games"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { gameId, round } = args;
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    // Check if the user is part of the game
    if (!game.players.includes(userId)) {
      throw new Error("You are not part of this game");
    }

    // Get all memes for the current round
    const memes = (await ctx.db.query("memes")
      .withIndex("by_game_round", (q) => q
        .eq("gameId", gameId)
        .eq("round", round))
      .collect())
      .map(meme => ({
        _id: meme._id,
        texts: meme.texts,
        template: meme.templates[meme.templateIndex],
        playerId: meme.playerId,
      }));

    // Get all votes for the current round
    const votes = await ctx.db.query("votes")
      .withIndex("by_game_round", (q) => q
        .eq("gameId", gameId)
        .eq("round", round))
      .collect();

    // Calculate scores for each meme
    const memeScores = memes.map(meme => {
      const memeVotes = votes.filter(vote => vote.memeId === meme._id);
      const score = memeVotes.reduce((acc, vote) => acc + vote.score, 0);
      return {
        ...meme,
        score,
        votes: memeVotes.length,
      };
    });

    // Sort memes by score
    memeScores.sort((a, b) => b.score - a.score);
    return {
      memes: memeScores,
      totalVotes: votes.length,
    };
  }
});

export const getFinalStats = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { gameId } = args;
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");

    // Check if the user is part of the game
    if (!game.players.includes(userId)) {
      throw new Error("You are not part of this game");
    }

    // Get all memes and votes for the final stats
    const memes = await ctx.db.query("memes")
      .withIndex("by_game", (q) => q
        .eq("gameId", gameId))
      .collect();

    const votes = await ctx.db.query("votes")
      .withIndex("by_game_round", (q) => q
        .eq("gameId", gameId))
      .collect();

    // Calculate scores for each meme
    const memeScores = memes.map(meme => {
      const memeVotes = votes.filter(vote => vote.memeId === meme._id);
      const score = memeVotes.reduce((acc, vote) => acc + vote.score, 0);
      return {
        ...meme,
        score,
        votes: memeVotes.length,
      };
    });

    // Sort memes by score
    memeScores.sort((a, b) => b.score - a.score);

    // Calculate scores for each player
    const playerScores = game.players.map(playerId => {
      const playerMemes = memeScores.filter(meme => meme.playerId === playerId);
      const totalScore = playerMemes.reduce((acc, meme) => acc + meme.score, 0);
      return {
        playerId,
        totalScore,
      };
    });

    return {
      memes: memeScores,
      totalVotes: votes.length,
      playerScores: playerScores.sort((a, b) => b.totalScore - a.totalScore),
    };
  }
});
