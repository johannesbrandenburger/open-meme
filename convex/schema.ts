import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const templateType = v.object({
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
});

const applicationTables = {
  games: defineTable({
    hostId: v.id("users"),
    status: v.union(
      v.literal("waiting"),
      v.literal("creating"),
      v.literal("voting"),
      v.literal("round_stats"),
      v.literal("final_stats"),
      v.literal("ended")
    ),

    timeLeft: v.number(),

    currentRound: v.number(),
    totalRounds: v.number(),
    votingMemeNo: v.number(),
    votingMemeId: v.optional(v.id("memes")), // TODO: maybe store order of memes for voting
    players: v.array(v.id("users")),

    createdAt: v.number(),
    startedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  memes: defineTable({
    gameId: v.id("games"),
    playerId: v.id("users"),
    round: v.number(),

    templateIndex: v.number(),
    texts: v.array(v.string()),
    templates: v.array(templateType), // 5 random templates for the player to choose from

    isSubmitted: v.boolean(),
    createdAt: v.number(),
  }).index("by_game_and_round", ["gameId", "round"])
    .index("by_game_player_round", ["gameId", "playerId", "round"]),

  votes: defineTable({
    userId: v.id("users"),
    round: v.number(),
    gameId: v.id("games"),
    memeId: v.id("memes"),
    score: v.union(v.literal(1), v.literal(-1), v.literal(0)),
    createdAt: v.number(),
  }).index("by_game_round", ["gameId", "round"]),

};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
