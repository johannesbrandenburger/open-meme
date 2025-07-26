"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAction, useConvexAuth, useMutation } from "convex/react";
import { SignIn } from "./components/SignIn";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

export default function App() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  const createGame = useMutation(api.games.createGame);

  const navigateToGame = (newGameId: string) => {
    router.push(`/game/${newGameId}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <SignIn />
    );
  }

  const handleCreateGame = async () => {
    toast("Creating new game...", { icon: "⏳" });
    const newGameId = await createGame();
    if (!newGameId) {
      toast.error("Failed to create game");
      return;
    }
    navigateToGame(newGameId);
  };

  return (
    <div>
      <h1>Welcome to Open Meme</h1>
      <button onClick={handleCreateGame}>Create New Game</button>
      <button onClick={() => {
        void signOut().then(() => {
          router.push("/signin");
        })
      }}>Sign Out</button>
    </div>
  );


}
