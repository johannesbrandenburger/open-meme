import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface WaitingScreenProps {
  game: any;
  playerId: string;
  onNavigateToHome: () => void;
}

export function WaitingScreen({ game, playerId, onNavigateToHome }: WaitingScreenProps) {
  const startGame = useMutation(api.games.startGame);

  const handleStartGame = async () => {
    try {
      await startGame({
        gameId: game.gameId,
        hostId: playerId,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to start game");
    }
  };

  const handleCopyLink = async () => {
    const gameUrl = `${window.location.origin}/game/${game.gameId}`;
    await navigator.clipboard.writeText(gameUrl);
    toast.success("Game link copied to clipboard!");
  };

  const isHost = game.currentPlayer?.isHost;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Waiting for Players</h1>
          <p className="text-gray-600">Game ID: {game.gameId}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Players ({game.players.length})
          </h3>
          <div className="space-y-2">
            {game.players.map((player: any) => (
              <div
                key={player.playerId}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <span className="font-medium text-gray-800">{player.nickname}</span>
                {player.isHost && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCopyLink}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all"
          >
            📋 Copy Game Link
          </button>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={game.players.length < 1}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {game.players.length < 1 ? "Need at least 1 player" : "Start Game"}
            </button>
          ) : (
            <div className="text-center text-gray-600">
              Waiting for host to start the game...
            </div>
          )}

          <button
            onClick={onNavigateToHome}
            className="w-full bg-red-100 text-red-700 font-semibold py-3 px-6 rounded-lg hover:bg-red-200 transition-all"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
