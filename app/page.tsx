"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignIn } from "./components/SignIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LogOut, Zap } from "lucide-react";
import { useState } from "react";

export default function App() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [isCreating, setIsCreating] = useState(false);

  const createGame = useMutation(api.games.createGame);

  const navigateToGame = (newGameId: string) => {
    router.push(`/game/${newGameId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      // toast("Creating new game...", { icon: "⏳" });
      const newGameId = await createGame();
      if (!newGameId) {
        toast.error("Failed to create game");
        return;
      }
      navigateToGame(newGameId);
    } catch (error) {
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">OpenMeme</CardTitle>
          {/* <p className="text-white/80 text-sm">Create hilarious memes with friends!</p> */}
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="default" 
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 font-semibold py-3 shadow-lg"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Creating Game...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create New Game
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              void signOut().then(() => {
                router.push("/");
              })
            }}
            className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
