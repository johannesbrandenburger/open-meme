import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import templatesJson from "./templates.json";

export const getRandomMemeTemplate = query({
  args: { excludeTemplates: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const exclude = args.excludeTemplates || [];
    const availableTemplates = templatesJson;
    const filteredTemplates = availableTemplates.filter(
      (template) => !exclude.includes(template.name)
    );
    if (filteredTemplates.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * filteredTemplates.length);
    return filteredTemplates[randomIndex];
  },
});

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
      // Update existing meme
      await ctx.db.patch(existingMeme._id, {
        templateName: args.templateName,
        texts: args.texts,
      });
    } else {
      // Create new meme
      await ctx.db.insert("memes", {
        gameId: args.gameId,
        playerId: args.playerId,
        round: game.currentRound,
        templateName: args.templateName,
        texts: args.texts,
        score: 0,
        createdAt: Date.now(),
      });
    }

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
  returns: v.array(
    v.object({
      _id: v.id("memes"),
      _creationTime: v.number(),
      gameId: v.string(),
      playerId: v.string(),
      round: v.number(),
      templateName: v.string(),
      texts: v.array(v.string()),
      score: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const memes = await ctx.db
      .query("memes")
      .withIndex("by_game_and_round", (q) => 
        q.eq("gameId", args.gameId).eq("round", args.round)
      )
      .collect();

    // Shuffle memes for voting
    return memes.sort(() => Math.random() - 0.5);
  },
});
