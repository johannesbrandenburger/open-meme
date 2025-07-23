import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";

interface ResultsScreenProps {
  game: NonNullable<FunctionReturnType<typeof api.games.getGameState>>;
  playerId: string;
  isFinal?: boolean;
}

export function ResultsScreen({ game, playerId, isFinal = false }: ResultsScreenProps) {
  // Fetch current round memes or all memes depending on if it's final results
  const roundMemes = useQuery(api.memes.getRoundMemes, !isFinal ? {
    gameId: game.gameId,
    round: game.currentRound,
  } : "skip");
  
  // Only fetch all memes for final results
  const allGameMemes = useQuery(api.memes.getAllGameMemes, isFinal ? {
    gameId: game.gameId,
  } : "skip");

  const progressGame = useMutation(api.games.progressGame);

  // Auto-progress to next round after 10 seconds (if not final)
  useEffect(() => {
    if (!isFinal) {
      const timer = setTimeout(() => {
        progressGame({ gameId: game.gameId });
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isFinal, game.gameId, progressGame]);

  // Use the appropriate memes based on whether it's final results or not
  const memes = isFinal ? allGameMemes : roundMemes;

  if (!memes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  // Sort memes by score (highest first)
  const sortedMemes = [...memes].sort((a, b) => b.score - a.score);

  // Get player names
  const getPlayerName = (playerId: string) => {
    const player = game.players.find((p) => p.playerId === playerId);
    return player?.nickname || "Unknown";
  };

  // Calculate total scores if final
  const playerTotalScores = isFinal ? 
    game.players.map((player) => ({
      ...player,
      totalScore: memes
        .filter((meme) => meme.playerId === player.playerId)
        .reduce((sum: number, meme) => sum + meme.score, 0)
    })).sort((a, b) => b.totalScore - a.totalScore) : [];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isFinal ? "🏆 Final Results!" : `Round ${game.currentRound} Results`}
          </h2>
          {!isFinal && (
            <p className="text-gray-600">Next round starts in 10 seconds...</p>
          )}
        </div>

        {/* Final Leaderboard */}
        {isFinal && (
          <div className="bg-white p-6 border-t">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Final Leaderboard</h3>
            <div className="space-y-3">
              {playerTotalScores.map((player, index: number) => (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                    index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                    index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="font-semibold text-lg">{player.nickname}</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    {player.totalScore} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meme Results */}
        <div className="bg-white rounded-b-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {isFinal ? "All Memes" : "Round Results"}
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            {sortedMemes.map((meme, index: number) => (
              <div
                key={meme._id}
                className={`border rounded-lg p-4 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50' :
                  index === 1 ? 'border-gray-400 bg-gray-50' :
                  index === 2 ? 'border-orange-400 bg-orange-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="font-semibold">{getPlayerName(meme.playerId)}</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {meme.score} pts
                  </span>
                </div>
                <div className="flex justify-center">
                  <div className="w-48">
                    <MemeCanvas 
                      template={meme.template} 
                      texts={meme.texts} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {isFinal && (
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
