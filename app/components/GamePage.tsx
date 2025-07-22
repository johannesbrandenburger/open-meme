import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { WaitingScreen } from "./WaitingScreen";
import { MemeCreationScreen } from "./MemeCreationScreen";
import { VotingScreen } from "./VotingScreen";
import { ResultsScreen } from "./ResultsScreen";

interface GamePageProps {
  gameId: string;
  playerId: string;
  onNavigateToHome: () => void;
}

export function GamePage({ gameId, playerId, onNavigateToHome }: GamePageProps) {
  const [nickname, setNickname] = useState(() => 
    localStorage.getItem("openmeme-nickname") || ""
  );
  const [hasJoined, setHasJoined] = useState(false);

  const game = useQuery(api.games.getGameForPlayer, { gameId, playerId });
  const joinGame = useMutation(api.games.joinGame);

  // Auto-join game when nickname is available
  useEffect(() => {
    if (nickname && !hasJoined && game === null) {
      handleJoinGame();
    }
  }, [nickname, hasJoined, game]);

  // Auto-join if game exists and player is already in it
  useEffect(() => {
    if (game && game.currentPlayer && !hasJoined) {
      setHasJoined(true);
    }
  }, [game, hasJoined]);

  const handleJoinGame = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    try {
      localStorage.setItem("openmeme-nickname", nickname.trim());
      await joinGame({
        gameId,
        playerId,
        nickname: nickname.trim(),
      });
      setHasJoined(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to join game");
      if (error.message === "Game not found") {
        onNavigateToHome();
      }
    }
  };

  // Show nickname input if not set
  if (!nickname) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Game</h2>
            <p className="text-gray-600">Enter your nickname to join</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              maxLength={20}
            />
            <button
              onClick={handleJoinGame}
              disabled={!nickname.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (game === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Game not found
  if (game === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Not Found</h2>
          <p className="text-gray-600 mb-6">This game doesn&apos;t exist or has ended.</p>
          <button
            onClick={onNavigateToHome}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate screen based on game status
  switch (game.status) {
    case "waiting":
      return <WaitingScreen game={game} playerId={playerId} onNavigateToHome={onNavigateToHome} />;
    case "creating":
      return <MemeCreationScreen game={game} playerId={playerId} />;
    case "voting":
      return <VotingScreen game={game} playerId={playerId} />;
    case "results":
      return <ResultsScreen game={game} playerId={playerId} />;
    case "finished":
      return <ResultsScreen game={game} playerId={playerId} isFinal={true} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Unknown game state</div>
        </div>
      );
  }
}
