import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import templatesJson from "./templates.json";
import { CREATION_TIME } from "./games";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

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

export const nextShuffle = mutation({
  args: {
    memeId: v.id("memes"),
  },
  handler: async (ctx, args) => {
    const { memeId } = args;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");
    
    const meme = await ctx.db.get(memeId);
    if (!meme) {
      throw new Error("Meme not found");
    }
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

    const meme = await ctx.db.get(memeId);
    if (!meme) {
      throw new Error("Meme not found");
    }
    if (meme.playerId !== userId) {
      throw new Error("You can only submit your own memes");
    }

    await ctx.db.patch(memeId, {
      texts,
      isSubmitted: true,
      createdAt: Date.now(),
    });
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

    const meme = await ctx.db.get(memeId);
    if (!meme) {
      throw new Error("Meme not found");
    }
    if (meme.playerId !== userId) {
      throw new Error("You can only update your own memes");
    }

    await ctx.db.patch(memeId, {
      texts,
      createdAt: Date.now(),
    });
  }
});