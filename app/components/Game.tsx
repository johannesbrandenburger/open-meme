"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { MemeCreationScreen } from "@/app/components/MemeCreationScreen";
import { ROUNDS } from "@/convex/games";
import { VotingScreen } from "@/app/components/VotingScreen";
import { SignIn } from "@/app/components/SignIn";

export default function Game() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.games.getGameStateForPlayer, { gameId });
  const startGame = useMutation(api.games.startGame);
  const joinGame = useMutation(api.games.joinGame);

  useEffect(() => {
    if (!gameId) {
      toast.error("Game ID is required");
      router.push("/");
    } else {
      joinGame({ gameId }).catch((error) => {
        console.error("Failed to join game:", error);
        toast.error("Failed to join game");
      });
    }
  }, [gameId, joinGame, router]);

  if (!gameId) return <div>Error: Game ID is required</div>;
  if (!game) return <div>Loading game...</div>;
  if (game == "GAME_NOT_FOUND") {
    toast.error("Game probably does not exist anymore");
    return (<>
      <div>Game not found</div>
      <button onClick={() => router.push("/")}>Go to Home</button>
    </>)
  }

  return (<>
    {/* only for dev: */}
    <h1>Game {gameId}</h1>
    <p>Status: {game.status}</p>
    <p>Time Left: {game.timeLeft} seconds</p>
    <p>Round: {game.currentRound} of 3</p>

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

    {game?.status === "voting" && (
      <div>
        <h2>Voting Phase</h2>
        <VotingScreen game={game} />
      </div>
    )}

  </>);
}
