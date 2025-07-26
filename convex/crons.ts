import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";


const crons = cronJobs();

// NOTE: This in old way of doing the scheduling
// see end of `startGame` in `games.ts` (the evaluation whats better is still open)
// crons.interval(
//   "tickGames",
//   { seconds: 1 }, // every minute
//   internal.games.tickGames,
// );

export default crons;