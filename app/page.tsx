"use client";

import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignIn } from "./components/SignIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Loader2, Sticker, TriangleAlert, Check } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { useMutationWithMoreInfo } from "@/lib/utils";

export default function App() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  const [createGame] = useMutationWithMoreInfo(api.games.createGame);

  const navigateToGame = (newGameId: string) => {
    router.push(`/game/${newGameId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-border/80 shadow-md">
          <CardContent>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Loading your table...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  const handleCreateGame = async () => {
    const newGameId = await createGame();
    if (!newGameId) {
      throw new Error("Failed to create game");
    }
    navigateToGame(newGameId);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Sticker className="size-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-semibold">OpenMeme</CardTitle>
            <p className="text-sm text-muted-foreground">Create a room and invite your friends.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActionButton
            variant="default"
            onAction={handleCreateGame}
            className="h-11 w-full font-semibold shadow-sm"
            label={<> <Plus /> <span>Create New Game</span> </>}
            loadingLabel={<> <Loader2 className="animate-spin" /> <span>Creating Game...</span> </>}
            failedLabel={<> <TriangleAlert /> <span>Failed to create game</span> </>}
            succeededLabel={<> <Check /> <span>Game created</span> </>}
          />
          <Button
            variant="outline"
            onClick={() => {
              void signOut().then(() => {
                router.push("/");
              })
            }}
            className="h-11 w-full"
          >
            <LogOut />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
