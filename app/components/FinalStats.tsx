import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Star, PartyPopper, Loader2, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface FinalStatsProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function FinalStats({ game }: FinalStatsProps) {
  const router = useRouter();
  const finalStats = useQuery(api.gamestate.getFinalStats, { gameId: game._id });

  if (!finalStats) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading final results...</span>
        </div>
      </div>
    );
  }

  const sortedPlayers = [...finalStats.playerScores].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  const getPlayerRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1: return <Trophy className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
  default: return <Star className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getPlayerRankBadgeColor = (index: number) => {
    switch (index) {
  case 0: return "bg-yellow-500/20 text-yellow-300";
  case 1: return "bg-gray-500/20 text-gray-300";
  case 2: return "bg-amber-600/20 text-amber-300";
  default: return "bg-muted text-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* Winner Celebration */}
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="animate-bounce">
              <PartyPopper className="w-16 h-16 text-yellow-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">🎉 Game Over! 🎉</h2>
          <div className="text-2xl font-semibold mb-1">
            Winner: {winner.nickname}
          </div>
          <p className="text-yellow-200">
            {winner.totalScore} {winner.totalScore === 1 ? 'point' : 'points'}
          </p>
          {winner.playerId === game.currentPlayer && (
            <Badge className="mt-3 border-0 font-semibold px-4 py-2">
              🏆 You Won! 🏆
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Final Leaderboard */}
    <Card>
        <CardHeader>
      <CardTitle className="text-xl text-center">Final Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.playerId} 
        className="flex items-center justify-between p-4 rounded-lg bg-card/60"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  {getPlayerRankIcon(index)}
                </div>
                <div>
          <div className="font-semibold">
                    {player.nickname}
                    {player.playerId === game.currentPlayer && (
            <span className="text-blue-400 text-sm ml-2">(You)</span>
                    )}
                  </div>
          <div className="text-muted-foreground text-sm">
                    Rank #{index + 1}
                  </div>
                </div>
              </div>
              
        <Badge className={`${getPlayerRankBadgeColor(index)} border-0 font-semibold`}>
                {player.totalScore} {player.totalScore === 1 ? 'point' : 'points'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* All Memes Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Meme Gallery</CardTitle>
          <p className="text-muted-foreground text-center">All the hilarious memes from this game!</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {finalStats.memes
            .sort((a, b) => b.score - a.score)
            .map((meme, index) => (
            <Card key={meme._id} className="bg-card/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{meme.nickname}</span>
                    {meme.playerId === game.currentPlayer && (
                      <Badge variant="outline" className="border-blue-400 text-blue-400 text-xs">
                        Your Meme
                      </Badge>
                    )}
                  </div>
                  <Badge className="bg-muted border-0">
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
        <Button onClick={() => router.push("/")} className="font-semibold px-8 py-3">
          <Home className="w-4 h-4 mr-2" />
          Play Again
        </Button>
      </div>
    </div>
  );
}