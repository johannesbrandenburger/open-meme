"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
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
import { Clock, Users, Play, Home, Crown, Share2, Loader2, TriangleAlert, Check, QrCode, Hash } from "lucide-react";
import { GameConfig } from "./GameConfig";
import { ActionButton } from "@/components/ui/action-button";

export default function Game() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as Id<"games">;
  const game = useQuery(api.gamestate.getGameStateForPlayer, { gameId });
  const startGame = useMutation(api.games.startGame);
  const joinGame = useMutation(api.games.joinGame);
  const hasRedirectedMissingGame = useRef(false);
  const [gameUrl, setGameUrl] = useState("");

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

  useEffect(() => {
    setGameUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (game !== "GAME_NOT_FOUND" || hasRedirectedMissingGame.current) return;

    hasRedirectedMissingGame.current = true;
    toast.error("That game doesn't exist anymore.");
    router.replace("/");
  }, [game, router]);

  if (!gameId) return null;

  if (!game || game === "GAME_NOT_FOUND") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-border/80 shadow-md">
          <CardContent>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Loading game...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartGame = async () => {
    await startGame({ gameId });
  };

  const copyGameUrl = async () => {
    const url = gameUrl || window.location.href;

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
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      {/* Game Header */}
      <Card className="border-border/80 shadow-md">
        <CardContent>
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="size-9 p-0"
              >
                <Home className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold sm:text-2xl">OpenMeme</h1>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-4">
              {game.status !== "waiting" && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">{game.timeLeft}s</span>
                </div>
              )}

              <Badge className="border-amber-200 bg-amber-100 text-amber-900 text-xs sm:text-sm">
                Round {game.currentRound} / {game.config.rounds}
              </Badge>
            </div>
          </div>

          {game.status !== "waiting" && game.timeLeft > 0 && (
            <div className="mt-3 sm:mt-4">
              <Progress
                value={(game.timeLeft / game.totalTime) * 100}
                className="h-2 bg-muted"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Content */}
      {game?.status === "waiting" && (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Waiting Room</CardTitle>
            <p className="text-sm text-muted-foreground sm:text-base">Invite players, tune the rules, then start.</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6">
                <div className="w-full space-y-3">
                  {game.isHost && (
                    <ActionButton
                      variant="default"
                      onAction={handleStartGame}
                      className="h-12 w-full font-semibold shadow-sm"
                      label={<> <Play /> <span>Start Game</span> </>}
                      loadingLabel={<> <Loader2 className="animate-spin" /> <span>Starting Game...</span> </>}
                      failedLabel={<> <TriangleAlert /> <span>Failed to start game</span> </>}
                      succeededLabel={<> <Check /> <span>Game started</span> </>}
                    />
                  )}
                  <ActionButton
                    variant="outline"
                    onAction={copyGameUrl}
                    className="h-12 w-full"
                    label={<> <Share2 /> <span>Share Game Link</span> </>}
                    loadingLabel={<> <Loader2 className="animate-spin" /> <span>Copying...</span> </>}
                    failedLabel={<> <TriangleAlert /> <span>Failed to copy link</span> </>}
                    succeededLabel={<> <Check /> <span>Game URL copied to clipboard</span> </>}
                  />
                </div>

                <div className="flex size-[12.5rem] items-center justify-center rounded-lg border border-border bg-card p-3">
                  {gameUrl ? (
                    <QRCodeSVG
                      value={gameUrl}
                      size={176}
                      bgColor="var(--card)"
                      fgColor="var(--primary)"
                      marginSize={1}
                      className="size-full rounded-md"
                      title="QR code for joining this game"
                    />
                  ) : (
                    <QrCode className="size-16 text-muted-foreground" />
                  )}
                </div>

                {game.joinNumber && (
                  <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <Hash className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Game number</span>
                    <span className="text-2xl font-semibold tabular-nums">{game.joinNumber}</span>
                  </div>
                )}
              </div>
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
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <span className="truncate text-sm font-medium sm:text-base">{player.name}</span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {player.id === game.currentPlayer && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                      {game.isHost && player.id === game.players[0]?.id && (
                        <Crown className="w-4 h-4 text-amber-500" />
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
        <Card className="border-border/80 shadow-md">
          <CardContent>
            <MemeCreationScreen game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "voting" && (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Vote for the Funniest</CardTitle>
            <p className="text-sm text-muted-foreground sm:text-base">Choose your favorite meme.</p>
          </CardHeader>
          <CardContent>
            <VotingScreen game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "round_stats" && (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Round {game.currentRound} Results</CardTitle>
            <p className="text-sm text-muted-foreground sm:text-base">See how everyone did.</p>
          </CardHeader>
          <CardContent>
            <RoundStats game={game} />
          </CardContent>
        </Card>
      )}

      {game?.status === "final_stats" && (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg sm:text-xl">Final Results</CardTitle>
            <p className="text-sm text-muted-foreground sm:text-base">The champion has been crowned.</p>
          </CardHeader>
          <CardContent>
            <FinalStats game={game} />
          </CardContent>
        </Card>
      )}

    </div>
  );
}
