"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignIn } from "./components/SignIn";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";

export default function App() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  const createGame = useMutation(api.games.createGame);

  const navigateToGame = (newGameId: string) => {
    router.push(`/game/${newGameId}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <SignIn />
    );
  }

  const handleCreateGame = async () => {
    toast("Creating new game...", { icon: "⏳" });
    const newGameId = await createGame();
    if (!newGameId) {
      toast.error("Failed to create game");
      return;
    }
    navigateToGame(newGameId);
  };

  return (
    <div>
      <Card className="w-full max-w-sm">
        <Button variant="default" onClick={handleCreateGame}>Create New Game</Button>
        <Button variant="destructive" onClick={() => {
          void signOut().then(() => {
            router.push("/");
          })
        }}>Sign Out</Button>
      </Card>
    </div>
  );
}
