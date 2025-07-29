import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const REMOVE_AFTER_HOURS = 24; // Remove games, memes, votes older than 24 hours

export const deleteOutdated = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const threshold = now - REMOVE_AFTER_HOURS * 60 * 60 * 1000;

        const outdatedGames = await ctx.db.query("games")
            .withIndex("by_creation_time", (q) => q
                .lt("_creationTime", threshold))
            .collect();
        const outdatedMemes = await ctx.db.query("memes")
            .withIndex("by_creation_time", (q) => q
                .lt("_creationTime", threshold))
            .collect();
        const outdatedVotes = await ctx.db.query("votes")
            .withIndex("by_creation_time", (q) => q
                .lt("_creationTime", threshold))
            .collect();

        // Delete outdated games, memes, and votes
        await Promise.all([
            ...outdatedGames.map(game => ctx.db.delete(game._id)),
            ...outdatedMemes.map(meme => ctx.db.delete(meme._id)),
            ...outdatedVotes.map(vote => ctx.db.delete(vote._id)),
        ]);
        return {
            deletedGames: outdatedGames.length,
            deletedMemes: outdatedMemes.length,
            deletedVotes: outdatedVotes.length,
        };
    }
});
