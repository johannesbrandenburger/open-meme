"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ReactMutation, useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignIn } from "./components/SignIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LogOut, Loader2, MessageSquareQuote, Sticker, TriangleAlert, Check } from "lucide-react";
import { useState } from "react";
import { FunctionReference } from "convex/server";
import { ActionButton } from "@/components/ui/action-button";
import { useMutationWithMoreInfo } from "@/lib/utils";

export default function App() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  // more info is not really needed here anymore since it is handled by the ActionButton component
  const [createGame, isCreating, creationFailed] = useMutationWithMoreInfo(api.games.createGame);

  const navigateToGame = (newGameId: string) => {
    router.push(`/game/${newGameId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-3">
        <Card className="w-full max-w-md mx-auto">
          <CardContent>
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-foreground" />
              <span>Loading...</span>
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
    <div className="flex items-center justify-center min-h-screen p-3">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-2 bg-[radial-gradient(circle_at_30%_30%,theme(colors.primary/60),transparent_60%),radial-gradient(circle_at_70%_70%,theme(colors.accent/50),transparent_60%)]">
            <Sticker className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">OpenMeme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ActionButton
            variant="default"
            onAction={handleCreateGame}
            className="w-full font-semibold h-11"
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
            className="w-full"
          >
            <LogOut className="" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
