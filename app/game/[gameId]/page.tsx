"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { GamePage } from "../../components/GamePage";

export default function GameRoute() {
  const params = useParams();
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string>("");

  const gameId = Array.isArray(params.gameId) ? params.gameId[0] : params.gameId;

  // Generate or retrieve player ID from localStorage
  useEffect(() => {
    let id = localStorage.getItem("openmeme-player-id");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("openmeme-player-id", id);
    }
    setPlayerId(id);
  }, []);

  const navigateToHome = () => {
    router.push("/");
  };

  if (!playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Game</h1>
          <button
            onClick={navigateToHome}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <GamePage
        gameId={gameId}
        playerId={playerId}
        onNavigateToHome={navigateToHome}
      />
      <Toaster />
    </div>
  );
}
