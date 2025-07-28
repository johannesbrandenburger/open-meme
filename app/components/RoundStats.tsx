import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal, Award, Loader2 } from "lucide-react";

interface RoundStatsProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function RoundStats({ game }: RoundStatsProps) {
  const roundStats = useQuery(api.gamestate.getRoundStats, { gameId: game._id });

  if (!roundStats) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-3 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading round stats...</span>
        </div>
      </div>
    );
  }

  const sortedMemes = [...roundStats.memes].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-white/60" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0: return "bg-gradient-to-r from-yellow-400 to-orange-500";
      case 1: return "bg-gradient-to-r from-gray-400 to-gray-500";
      case 2: return "bg-gradient-to-r from-amber-600 to-amber-700";
      default: return "bg-white/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Round Results</h3>
        <p className="text-white/80">See how the memes ranked this round!</p>
      </div>

      <div className="space-y-4">
        {sortedMemes.map((meme, index) => (
          <Card key={meme._id} className="bg-white/5 border-white/10 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRankIcon(index)}
                  <div>
                    <CardTitle className="text-white text-lg">
                      {meme.nickname}
                    </CardTitle>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={`${getRankBadgeColor(index)} text-white border-0 font-semibold`}>
                    {meme.score} {meme.score === 1 ? 'point' : 'points'}
                  </Badge>
                  {index === 0 && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      Winner!
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <MemeCanvas template={meme.template} texts={meme.texts} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedMemes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-white/60">No memes to display for this round.</p>
        </div>
      )}
    </div>
  );
}