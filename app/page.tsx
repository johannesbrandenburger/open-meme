"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { HomePage } from "./components/HomePage";
import { GamePage } from "./components/GamePage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "game">("home");
  const [gameId, setGameId] = useState<string>("");
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

  // Check URL for game ID
  useEffect(() => {
    const path = window.location.pathname;
    const gameMatch = path.match(/\/game\/([a-z0-9]+)/);
    if (gameMatch) {
      setGameId(gameMatch[1]);
      setCurrentPage("game");
    }
  }, []);

  const navigateToGame = (newGameId: string) => {
    setGameId(newGameId);
    setCurrentPage("game");
    window.history.pushState({}, "", `/game/${newGameId}`);
  };

  const navigateToHome = () => {
    setCurrentPage("home");
    setGameId("");
    window.history.pushState({}, "", "/");
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
      {currentPage === "home" ? (
        <HomePage playerId={playerId} onNavigateToGame={navigateToGame} />
      ) : (
        <GamePage
          gameId={gameId}
          playerId={playerId}
          onNavigateToHome={navigateToHome}
        />
      )}
      <Toaster />
    </div>
  );
}
