import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReference, FunctionReturnType } from "convex/server";

interface FinalStatsProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function FinalStats({ game }: FinalStatsProps) {

  const finalStats = useQuery(api.gamestate.getFinalStats, { gameId: game._id });

  return (<>
    <h2>Round {game.currentRound} Stats</h2>
    {finalStats ? (
      <div>

        <h3>Player Scores:</h3>
        <ul>
          {finalStats.playerScores.map((player) => (
            <li key={player.playerId}>
              <p>Player: {player.nickname}</p>
              <p>Total Score: {player.totalScore}</p>
            </li>
          ))}
        </ul>

        <h3>All Memes:</h3>
        <ul>
          {finalStats.memes.map((meme) => (
            <li key={meme._id}>
              <MemeCanvas template={meme.template} texts={meme.texts} />
              <p>Submitted by: {meme.nickname}</p>
              <p>Score: {meme.score}</p>
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <div>Loading round stats...</div>
    )}

  </>)
}