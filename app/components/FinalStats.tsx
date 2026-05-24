import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Star, PartyPopper, Loader2, Home, Download } from "lucide-react";
import { useRouter } from "next/navigation";

interface FinalStatsProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function FinalStats({ game }: FinalStatsProps) {
  const router = useRouter();
  const finalStats = useQuery(api.gamestate.getFinalStats, { gameId: game._id });

  if (!finalStats) {
    return (
      <div className="py-8 text-center">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Loading final results...</span>
        </div>
      </div>
    );
  }

  const sortedPlayers = [...finalStats.playerScores].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  const getPlayerRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-amber-500" />;
      case 1: return <Trophy className="w-6 h-6 text-slate-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <Star className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getPlayerRankBadgeColor = (index: number) => {
    switch (index) {
      case 0: return "border-amber-200 bg-amber-100 text-amber-900";
      case 1: return "border-slate-200 bg-slate-100 text-slate-700";
      case 2: return "border-orange-200 bg-orange-100 text-orange-900";
      default: return "border-border bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* Winner Celebration */}
      <Card className="border-amber-200 bg-amber-50 shadow-sm">
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-bounce">
              <PartyPopper className="w-16 h-16 text-amber-500" />
            </div>
          </div>
          <h2 className="mb-2 text-3xl font-semibold text-amber-900">Game Over</h2>
          <div className="mb-1 text-2xl font-semibold">
            Winner: {winner.nickname}
          </div>
          <p className="text-amber-800">
            {winner.totalScore} {winner.totalScore === 1 ? 'point' : 'points'}
          </p>
          {winner.playerId === game.currentPlayer && (
            <Badge className="mt-3 border-primary/20 bg-primary/10 px-4 py-2 font-semibold text-primary">
              You Won
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Final Leaderboard */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">Final Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.playerId} 
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex items-center space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-xs">
                  {getPlayerRankIcon(index)}
                </div>
                <div>
                  <div className="font-semibold">
                    {player.nickname}
                    {player.playerId === game.currentPlayer && (
                      <span className="ml-2 text-sm text-primary">(You)</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rank #{index + 1}
                  </div>
                </div>
              </div>
              
              <Badge className={`${getPlayerRankBadgeColor(index)} font-semibold`}>
                {player.totalScore} {player.totalScore === 1 ? 'point' : 'points'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* All Memes Gallery */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">Meme Gallery</CardTitle>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            <Download className="size-3.5" />
            <span>Click any meme to download it.</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {finalStats.memes
            .sort((a, b) => b.score - a.score)
            .map((meme, index) => (
            <Card key={meme._id} className="border-border bg-muted/20 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{meme.nickname}</span>
                    {meme.playerId === game.currentPlayer && (
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                        Your Meme
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {meme.score} {meme.score === 1 ? 'point' : 'points'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <MemeCanvas template={meme.template} texts={meme.texts} />
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="text-center">
        <Button 
          onClick={() => router.push("/")}
          className="px-8 py-3 font-semibold"
        >
          <Home className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </div>
    </div>
  );
}
