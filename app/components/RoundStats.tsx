import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";

interface RoundStatsProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function RoundStats({ game }: RoundStatsProps) {

  const roundStats = useQuery(api.gamestate.getRoundStats, { gameId: game._id });

  return (<>
    <h2>Round {game.currentRound} Stats</h2>
    {roundStats ? (
      <div>
        <h3>Memes:</h3>
        <ul>
          {roundStats.memes.map((meme) => (
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