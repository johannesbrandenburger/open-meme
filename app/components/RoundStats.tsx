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
      <div className="py-8 text-center">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Loading round stats...</span>
        </div>
      </div>
    );
  }

  const sortedMemes = [...roundStats.memes].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-amber-500" />;
      case 1: return <Medal className="w-5 h-5 text-slate-400" />;
      case 2: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0: return "border-amber-200 bg-amber-100 text-amber-900";
      case 1: return "border-slate-200 bg-slate-100 text-slate-700";
      case 2: return "border-orange-200 bg-orange-100 text-orange-900";
      default: return "border-border bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold">Round Results</h3>
        <p className="text-muted-foreground">See how the memes ranked this round.</p>
      </div>

      <div className="space-y-4">
        {sortedMemes.map((meme, index) => (
          <Card key={meme._id} className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRankIcon(index)}
                  <div>
                    <CardTitle className="text-lg">
                      {meme.nickname}
                    </CardTitle>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={`${getRankBadgeColor(index)} font-semibold`}>
                    {meme.score} {meme.score === 1 ? 'point' : 'points'}
                  </Badge>
                  {index === 0 && (
                    <Badge className="border-primary/20 bg-primary/10 text-primary">
                      Winner!
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <MemeCanvas template={meme.template} texts={meme.texts} />
          </Card>
        ))}
      </div>

      {sortedMemes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No memes to display for this round.</p>
        </div>
      )}
    </div>
  );
}
