"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { MemeCreationScreen } from "@/app/components/MemeCreationScreen";

export default function GameRoute() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.games.getGameStateForPlayer, { gameId });
  const startGame = useMutation(api.games.startGame);

  if (!gameId) return <div>Error: Game ID is required</div>;
  if (!game) return <div>Loading game...</div>;

  return (<>
    {/* <code>
      {JSON.stringify(game, null, 2)}
    </code> */}
    {/* only for dev: */}
    <h1>Game {gameId}</h1>
    <p>Status: {game.status}</p>
    <p>Time Left: {game.timeLeft} seconds</p>
    <p>Round: {game.currentRound}</p>

    {game?.status === "waiting" && (
      <button
        onClick={async () => {
          try {
            await startGame({ gameId });
            toast.success("Game started!");
          } catch (error) {
            console.error("Failed to start game:", error);
            toast.error("Failed to start game");
          }
        }}
      >
        Start Game
      </button>
    )}


    {game?.status === "creating" && (
      <div>
        <h2>Creating Memes</h2>
        <MemeCreationScreen game={game} />
      </div>
    )}
  </>);
}
