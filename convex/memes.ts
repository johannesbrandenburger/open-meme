import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import templatesJson from "./templates.json";

export const getMemeTemplate = (templateName: string) => {
  const template = templatesJson.find(
    (t) => t.name === templateName
  );
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }
  return {
    name: template.name,
    imgUrl: template.imgUrl,
    text: template.text,
  };
}

export const saveMeme = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    templateName: v.string(),
    texts: v.array(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Get current game to check round
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    // Check if player already has a meme for this round
    const existingMeme = await ctx.db
      .query("memes")
      .withIndex("by_game_player_round", (q) =>
        q.eq("gameId", args.gameId)
          .eq("playerId", args.playerId)
          .eq("round", game.currentRound)
      )
      .first();

    if (existingMeme) {
      // Don't update if already submitted
      if (existingMeme.submitted) {
        throw new Error("Meme already submitted and cannot be modified");
      }
      
      // Update existing meme (autosave)
      await ctx.db.patch(existingMeme._id, {
        templateName: args.templateName,
        texts: args.texts,
      });
    } else {
      // Create new meme (autosave)
      await ctx.db.insert("memes", {
        gameId: args.gameId,
        playerId: args.playerId,
        round: game.currentRound,
        templateName: args.templateName,
        texts: args.texts,
        score: 0,
        submitted: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const submitMeme = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Get current game to check round
    const game = await ctx.db
      .query("games")
      .withIndex("by_game_id", (q) => q.eq("gameId", args.gameId))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    // Get the player's meme for this round
    const existingMeme = await ctx.db
      .query("memes")
      .withIndex("by_game_player_round", (q) =>
        q.eq("gameId", args.gameId)
          .eq("playerId", args.playerId)
          .eq("round", game.currentRound)
      )
      .first();

    if (!existingMeme) {
      throw new Error("No meme found to submit");
    }

    if (existingMeme.submitted) {
      throw new Error("Meme already submitted");
    }

    // Mark as submitted
    await ctx.db.patch(existingMeme._id, {
      submitted: true,
    });

    return { success: true };
  },
});

export const getPlayerMeme = query({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    round: v.number(),
  },
  returns: v.union(
    v.object({
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memes")
      .withIndex("by_game_player_round", (q) =>
        q.eq("gameId", args.gameId)
          .eq("playerId", args.playerId)
          .eq("round", args.round)
      )
      .first();
  },
});

export const getRoundMemes = query({
  args: {
    gameId: v.string(),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const memes = await ctx.db
      .query("memes")
      .withIndex("by_game_and_round", (q) =>
        q.eq("gameId", args.gameId).eq("round", args.round)
      )
      .collect();

    // enrich memes with template data
    const enrichedMemes = memes.map((meme) => {
      const template = getMemeTemplate(meme.templateName);
      return {
        ...meme,
        template: template,
      };
    });

    // Shuffle memes for voting
    return enrichedMemes.sort(() => Math.random() - 0.5);
  },
});
