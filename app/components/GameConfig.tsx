import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FunctionReturnType } from "convex/server";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider"

interface GameConfigProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function GameConfig({ game }: GameConfigProps) {
  const updateGame = useMutation(api.games.updateGame).withOptimisticUpdate(
    (localStore, args) => {
      const { gameId, config } = args;
      const currentGame = localStore.getQuery(api.gamestate.getGameStateForPlayer, { gameId });
      if (currentGame) {
        if (currentGame == "GAME_NOT_FOUND") return;
        localStore.setQuery(api.gamestate.getGameStateForPlayer, { gameId }, {
          ...currentGame,
          config: {
            ...currentGame.config,
            ...config,
          },
        });
      }
    }
  );
  

  return (
    <div className="space-y-8">
      <Card className="border-border bg-muted/30 shadow-none">
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Rounds</span>
                <span className="min-w-[2rem] text-right text-muted-foreground">{game.config.rounds}</span>
              </div>
              <Slider
                value={[game.config.rounds]}
                onValueChange={(value) => updateGame({ gameId: game._id, config: { ...game.config, rounds: value[0] } })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Memes Per Round</span>
                <span className="min-w-[2rem] text-right text-muted-foreground">{game.config.memesPerRound}</span>
              </div>
              <Slider
                value={[game.config.memesPerRound]}
                onValueChange={(value) => updateGame({ gameId: game._id, config: { ...game.config, memesPerRound: value[0] } })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Creation Time</span>
                <span className="min-w-[2rem] text-right text-muted-foreground">{game.config.creationTime}s</span>
              </div>
              <Slider
                value={[game.config.creationTime]}
                onValueChange={(value) => updateGame({ gameId: game._id, config: { ...game.config, creationTime: value[0] } })}
                min={30}
                max={120}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Vote Time</span>
                <span className="min-w-[2rem] text-right text-muted-foreground">{game.config.voteTime}s</span>
              </div>
              <Slider
                value={[game.config.voteTime]}
                onValueChange={(value) => updateGame({ gameId: game._id, config: { ...game.config, voteTime: value[0] } })}
                min={10}
                max={60}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Round Stats Time</span>
                <span className="min-w-[2rem] text-right text-muted-foreground">{game.config.roundStatsTime}s</span>
              </div>
              <Slider
                value={[game.config.roundStatsTime]}
                onValueChange={(value) => updateGame({ gameId: game._id, config: { ...game.config, roundStatsTime: value[0] } })}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Final Stats Time</span>
                <span className="min-w-[2rem] text-right text-muted-foreground">{game.config.finalStatsTime}s</span>
              </div>
              <Slider
                value={[game.config.finalStatsTime]}
                onValueChange={(value) => updateGame({ gameId: game._id, config: { ...game.config, finalStatsTime: value[0] } })}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
