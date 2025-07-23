import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/*
    "text": [
      {
        "style": "upper",
        "color": "white",
        "font": "thick",
        "anchor_x": 0,
        "anchor_y": 0,
        "angle": 0,
        "scale_x": 1,
        "scale_y": 0.2,
        "align": "center",
        "start": 0,
        "stop": 1
      },
      {
        "style": "upper",
        "color": "white",
        "font": "thick",
        "anchor_x": 0,
        "anchor_y": 0.8,
        "angle": 0,
        "scale_x": 1,
        "scale_y": 0.2,
        "align": "center",
        "start": 0,
        "stop": 1
      }
    ],
    "example": [
      "",
      "aliens"
    ]
*/

const applicationTables = {
  games: defineTable({
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
    phaseEndTime: v.optional(v.number()), // Server timestamp when current phase ends
    votingMemeIndex: v.optional(v.number()), // Current meme being voted on
    createdAt: v.number(),
    lastProgressTime: v.optional(v.number()), // Track when game was last progressed
  }).index("by_game_id", ["gameId"])
    .index("by_status", ["status"]),

  players: defineTable({
    gameId: v.string(),
    playerId: v.string(),
    nickname: v.string(),
    totalScore: v.number(),
    isHost: v.boolean(),
    joinedAt: v.number(),
  }).index("by_game_id", ["gameId"])
    .index("by_player_id", ["playerId"]),

  memes: defineTable({
    gameId: v.string(),
    playerId: v.string(),
    round: v.number(),
    templateName: v.string(),
    texts: v.array(v.string()),
    score: v.number(),
    createdAt: v.number(),
  }).index("by_game_and_round", ["gameId", "round"])
    .index("by_game_player_round", ["gameId", "playerId", "round"]),

  votes: defineTable({
    gameId: v.string(),
    round: v.number(),
    voterId: v.string(),
    memeId: v.id("memes"),
    vote: v.union(v.literal(1), v.literal(-1), v.literal(0)),
    createdAt: v.number(),
  }).index("by_game_round", ["gameId", "round"])
    .index("by_voter_meme", ["voterId", "memeId"]),

  gameTemplates: defineTable({
    gameId: v.string(),
    playerId: v.string(),
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
  }).index("by_game_player", ["gameId", "playerId"])
    .index("by_game_template", ["gameId", "name"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
