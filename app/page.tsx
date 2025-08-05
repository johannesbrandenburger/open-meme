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
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
          <CardContent className="">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <span className="text-white">Loading...</span>
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
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Sticker className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">OpenMeme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ActionButton
            variant="default"
            onAction={handleCreateGame}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 font-semibold py-3 shadow-lg"
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
            className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <LogOut className="" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
