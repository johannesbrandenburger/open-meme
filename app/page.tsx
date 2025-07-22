"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { HomePage } from "./components/HomePage";

export default function App() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string>("");

  // Generate or retrieve player ID from localStorage
  useEffect(() => {
    let id = localStorage.getItem("openmeme-player-id");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("openmeme-player-id", id);
    }
    setPlayerId(id);
  }, []);

  const navigateToGame = (newGameId: string) => {
    router.push(`/game/${newGameId}`);
  };

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <HomePage playerId={playerId} onNavigateToGame={navigateToGame} />
      <Toaster />
    </div>
  );
}
