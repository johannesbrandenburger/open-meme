import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { shuffled } from "./random";
import { GenericMutationCtx } from "convex/server";
import { DataModel, Id } from "./_generated/dataModel";

async function requireEditableCurrentMeme(ctx: GenericMutationCtx<DataModel>, memeId: Id<"memes">) {
  const meme = await ctx.db.get(memeId);
  if (!meme) {
    throw new Error("Meme not found");
  }

  const game = await ctx.db.get(meme.gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  if (game.status !== "creating") {
    throw new Error("Meme can only be edited during creation");
  }
  if (meme.round !== game.currentRound) {
    throw new Error("Meme is not for the current round");
  }
  if (meme.isSubmitted) {
    throw new Error("Submitted memes can no longer be edited");
  }

  return { game, meme };
}

export const getMeme = query({
  args: {
    playerId: v.id("users"),
    gameId: v.id("games"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");
    const { playerId, gameId, round } = args;
    const meme = await ctx.db.query("memes")
      .withIndex("by_game_player_round", (q) => q
        .eq("gameId", gameId)
        .eq("playerId", playerId)
        .eq("round", round))
      .first();

    if (!meme) {
      throw new Error("Meme not found");
    }
    return meme;
  }
});

export const getOwnMeme = query({
  args: {
    gameId: v.id("games")
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");
    const { gameId } = args;
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found");
    const meme = await ctx.db.query("memes")
      .withIndex("by_game_player_round", (q) => q
        .eq("gameId", gameId)
        .eq("playerId", userId)
        .eq("round", game.currentRound))
      .first();

    if (!meme) {
      throw new Error("Meme not found");
    }
    return meme;
  }
});

export const nextShuffle = mutation({
  args: {
    memeId: v.id("memes"),
  },
  handler: async (ctx, args) => {
    const { memeId } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");
    
    const { meme } = await requireEditableCurrentMeme(ctx, memeId);
    if (meme.playerId !== userId) {
      throw new Error("You can only shuffle your own memes");
    }

    const currTemplateIndex = meme.templateIndex;
    const newTemplateIndex = (currTemplateIndex + 1) % meme.templates.length;
    await ctx.db.patch(memeId, {
      templateIndex: newTemplateIndex,
      texts: meme.templates[newTemplateIndex]?.text?.map(_ => "") || [] as string[], // Default empty texts (can be filled with examples later)
    });
  }
});

export const submitMeme = mutation({
  args: {
    memeId: v.id("memes"),
    texts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { memeId, texts } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { game, meme } = await requireEditableCurrentMeme(ctx, memeId);
    if (meme.playerId !== userId) {
      throw new Error("You can only submit your own memes");
    }

    await ctx.db.patch(memeId, {
      texts,
      isSubmitted: true,
      createdAt: Date.now(),
    });


    // if now every player has submitted their meme, we can start the voting
    const memesOfCurrentRound = await ctx.db.query("memes")
      .withIndex("by_game_round", (q) => q
        .eq("gameId", game._id)
        .eq("round", game.currentRound))
      .collect();
    const allSubmitted = memesOfCurrentRound.every(m => m.isSubmitted);
    if (allSubmitted) {
      const submittedMemes = memesOfCurrentRound.filter(meme => meme.isSubmitted);
      const votingMemes = shuffled(submittedMemes).map(meme => meme._id);
      await ctx.db.patch(game._id, {
        status: "voting",
        timeLeft: game.config.voteTime,
        votingMemeNo: 1,
        votingMemes: votingMemes,
      });
    }
  }
});

// just for auto save
export const updateMeme = mutation({
  args: {
    memeId: v.id("memes"),
    texts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { memeId, texts } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const { meme } = await requireEditableCurrentMeme(ctx, memeId);
    if (meme.playerId !== userId) {
      throw new Error("You can only update your own memes");
    }

    await ctx.db.patch(memeId, {
      texts,
      createdAt: Date.now(),
    });
  }
});
