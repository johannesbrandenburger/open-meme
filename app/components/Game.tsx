"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { MemeCreationScreen } from "@/app/components/MemeCreationScreen";
import { VotingScreen } from "@/app/components/VotingScreen";
import { SignIn } from "@/app/components/SignIn";
import { RoundStats } from "./RoundStats";
import { FinalStats } from "./FinalStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Play, Home, Crown, Timer, Share2, Copy, Loader2, TriangleAlert, Check } from "lucide-react";
import { GameConfig } from "./GameConfig";
import { ActionButton } from "@/components/ui/action-button";

export default function Game() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.gamestate.getGameStateForPlayer, { gameId });
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

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen p-3">
        <Card className="w-full max-w-md mx-auto">
          <CardContent>
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/70 border-t-transparent"></div>
              <span>Loading game...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (game == "GAME_NOT_FOUND") {
    return (
      <div className="flex items-center justify-center min-h-screen p-3">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Game Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">This game probably doesn't exist anymore</p>
            <Button onClick={() => router.push("/")}> 
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartGame = async () => {
    await startGame({ gameId });
  };

  const copyGameUrl = async () => {
    const url = window.location.href;

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      // Fallback for older browsers and iPhone Safari
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
      {/* Game Header */}
      <Card className="shadow-xl">
        <CardContent>
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="p-2 h-8 w-8"
              >
                <Home className="w-4 h-4" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">OpenMeme</h1>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-4">
              {game.status !== "waiting" && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">{game.timeLeft}s</span>
                </div>
              )}

              <Badge className="text-xs sm:text-sm">
                Round {game.currentRound} / {game.config.rounds}
              </Badge>
            </div>
          </div>

          {game.status !== "waiting" && game.timeLeft > 0 && (
            <div className="mt-3 sm:mt-4">
              <Progress
                value={(game.timeLeft / game.totalTime) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Content */}
      {game?.status === "waiting" && (
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Waiting Room</CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">Waiting for players to join...</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-3">
              {game.isHost && (
                <ActionButton
                  variant="gradient"
                  onAction={handleStartGame}
                  className="w-full font-semibold h-11"
                  label={<> <Play /> <span>Start Game</span> </>}
                  loadingLabel={<> <Loader2 className="animate-spin" /> <span>Starting Game...</span> </>}
                  failedLabel={<> <TriangleAlert /> <span>Failed to start game</span> </>}
                  succeededLabel={<> <Check /> <span>Game started</span> </>}
                />
              )}
              <ActionButton
                variant="outline"
                onAction={copyGameUrl}
                className="w-full h-11 sm:h-auto"
                label={<> <Share2 /> <span>Share Game Link</span> </>}
                loadingLabel={<> <Loader2 className="animate-spin" /> <span>Copying...</span> </>}
                failedLabel={<> <TriangleAlert /> <span>Failed to copy link</span> </>}
                succeededLabel={<> <Check /> <span>Game URL copied to clipboard</span> </>}
              />
            </div>

            {game.isHost && (
              <GameConfig game={game} />
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">Players ({game.players.length})</span>
              </div>
              <div className="space-y-2">
                {game.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/60"
                  >
                    <span className="font-medium text-sm sm:text-base truncate">{player.name}</span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {player.id === game.currentPlayer && (
                        <Badge variant="outline" className="text-xs">
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
        <Card className="shadow-xl">
          <CardContent>
            <MemeCreationScreen game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "voting" && (
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Vote for the Funniest</CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">Choose your favorite meme!</p>
          </CardHeader>
          <CardContent>
            <VotingScreen game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "round_stats" && (
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Round {game.currentRound} Results</CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">See how everyone did!</p>
          </CardHeader>
          <CardContent>
            <RoundStats game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "final_stats" && (
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">🎉 Final Results</CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">The meme champion has been crowned!</p>
          </CardHeader>
          <CardContent>
            <FinalStats game={game} />
          </CardContent>
        </Card>
      )}

    </div>
  );
}
