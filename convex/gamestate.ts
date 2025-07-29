import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { CREATION_TIME, FINAL_STATS_TIME, ROUND_STATS_TIME, VOTE_TIME } from "./games";


export const getGameStateForPlayer = query({
  args: {
    gameId: v.optional(v.id("games")), // NOTE: this is optional since the query is used with a URL param (not there when initializing the query)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { gameId } = args;
    if (!gameId) return null;
    const game = await ctx.db.get(gameId);
    if (!game) return "GAME_NOT_FOUND"; // NOTE: Magic string (not nice, but works for now)

    // Check if the user is part of the game
    if (!game.players.includes(userId)) {
      return null;
    }

    // fill the players
    const players = await Promise.all(game.players.map(async (playerId) => {
      const player = await ctx.db.get(playerId);
      return {
        id: playerId,
        name: player?.name || "Unknown",
      };
    }));

    // if is voting, provide the current meme for the user
    let currentVotingMeme = undefined;
    let isVotingOnOwnMeme = false;
    if (game.status === "voting") {

      // Get the current meme for voting
      const currentVotingMemeId = game.votingMemes[game.votingMemeNo - 1];
      currentVotingMeme = await ctx.db.get(currentVotingMemeId);
      if (!currentVotingMeme) {
        throw new Error("Voting meme not found");
      }

      // Check if the user is voting on their own meme
      isVotingOnOwnMeme = currentVotingMeme.playerId === userId;
    }

    // fill game.totalTime
    let totalTime = 0;
    if (game.status === "creating") {
      totalTime = CREATION_TIME;
    } else if (game.status === "voting") {
      totalTime = VOTE_TIME;
    } else if (game.status === "waiting") {
      totalTime = Infinity; // Waiting state has no time limit
    } else if (game.status === "round_stats") {
      totalTime = ROUND_STATS_TIME;
    } else if (game.status === "final_stats") {
      totalTime = FINAL_STATS_TIME;
    }

    return {
      ...game,
      currentPlayer: userId,
      currentVotingMeme,
      isVotingOnOwnMeme,
      isHost: game.hostId === userId,
      players,
      totalTime,
    };
  }
});

export const getRoundStats = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { gameId } = args;
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const round = game.currentRound;

    // Check if the user is part of the game
    if (!game.players.includes(userId)) {
      throw new Error("You are not part of this game");
    }

    // Get all memes for the current round
    const memes = await Promise.all((await ctx.db.query("memes")
      .withIndex("by_game_round", (q) => q
        .eq("gameId", gameId)
        .eq("round", round))
      .collect())
      .map(async meme => {
        const user = await ctx.db.get(meme.playerId);
        return {
          _id: meme._id,
          texts: meme.texts,
          template: meme.templates[meme.templateIndex],
          nickname: user?.name,
        };
      })
    );

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
    const memes = await Promise.all((await ctx.db.query("memes")
      .withIndex("by_game", (q) => q
        .eq("gameId", gameId))
      .collect())
      .map(async meme => {
        const user = await ctx.db.get(meme.playerId);
        return {
          _id: meme._id,
          texts: meme.texts,
          template: meme.templates[meme.templateIndex],
          nickname: user?.name,
          playerId: meme.playerId,
        };
      })
    );

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
        nickname: playerMemes[0]?.nickname || "Unknown",
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
