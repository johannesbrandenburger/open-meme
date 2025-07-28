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
import { RoundStats } from "./RoundStats";
import { FinalStats } from "./FinalStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Play, Home, Crown, Timer } from "lucide-react";

export default function Game() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.gamestate.getGameStateForPlayer, { gameId });
  const startGame = useMutation(api.games.startGame);
  const joinGame = useMutation(api.games.joinGame);
  const [isStarting, setIsStarting] = useState(false);

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
  
  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              <span className="text-white">Loading game...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (game == "GAME_NOT_FOUND") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Game Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-white/80">This game probably doesn't exist anymore</p>
            <Button 
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await startGame({ gameId });
      toast.success("Game started!");
    } catch (error) {
      console.error("Failed to start game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
      {/* Game Header */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
        <CardContent className="">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white">OpenMeme</h1>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end space-x-4">
              {game.status !== "waiting" && (
                <div className="flex items-center space-x-2 text-white">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">{game.timeLeft}s</span>
                </div>
              )}
              
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs sm:text-sm">
                Round {game.currentRound} / {ROUNDS}
              </Badge>
            </div>
          </div>
          
          {game.status !== "waiting" && game.timeLeft > 0 && (
            <div className="mt-3 sm:mt-4">
              <Progress 
                value={(game.timeLeft / (game.status === "creating" ? 60 : 30)) * 100} 
                className="h-2 bg-white/20"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Content */}
      {game?.status === "waiting" && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl text-white">Waiting Room</CardTitle>
            <p className="text-white/80 text-sm sm:text-base">Get ready for some meme magic!</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {game.isHost && (
              <Button
                onClick={handleStartGame}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 font-semibold py-3 h-12 sm:h-auto shadow-lg"
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Game {game.players.length < 2 && "(Need 2+ players)"}
                  </>
                )}
              </Button>
            )}

            {!game.isHost && (
              <div className="text-center py-4">
                <div className="animate-pulse flex items-center justify-center space-x-2 text-white/80">
                  <Timer className="w-5 h-5" />
                  <span className="text-sm sm:text-base">Waiting for the host to start the game...</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white">
                <Users className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">Players ({game.players.length})</span>
              </div>
              <div className="space-y-2">
                {game.players.map((player) => (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                  >
                    <span className="text-white font-medium text-sm sm:text-base truncate">{player.name}</span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {player.id === game.currentPlayer && (
                        <Badge variant="outline" className="border-white/30 text-white text-xs">
                          You
                        </Badge>
                      )}
                      {game.isHost && player.id === game.players[0]?.id && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {game?.status === "creating" && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl text-white">Create Your Meme</CardTitle>
            <p className="text-white/80 text-sm sm:text-base">Time to get creative!</p>
          </CardHeader>
          <CardContent>
            <MemeCreationScreen game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "voting" && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl text-white">Vote for the Funniest</CardTitle>
            <p className="text-white/80 text-sm sm:text-base">Choose your favorite meme!</p>
          </CardHeader>
          <CardContent>
            <VotingScreen game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "round_stats" && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl text-white">Round {game.currentRound} Results</CardTitle>
            <p className="text-white/80 text-sm sm:text-base">See how everyone did!</p>
          </CardHeader>
          <CardContent>
            <RoundStats game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "final_stats" && (
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl text-white">🎉 Final Results</CardTitle>
            <p className="text-white/80 text-sm sm:text-base">The meme champion has been crowned!</p>
          </CardHeader>
          <CardContent>
            <FinalStats game={game} />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="text-center pb-4">
        <Button 
          variant="outline"
          onClick={() => router.push("/")}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );
}
