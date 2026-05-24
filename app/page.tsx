"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignIn } from "./components/SignIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, LogOut, Loader2, Sticker, TriangleAlert, Check, Hash, LogIn } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { useMutationWithMoreInfo } from "@/lib/utils";

export default function App() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [joinNumber, setJoinNumber] = useState("");

  const [createGame] = useMutationWithMoreInfo(api.games.createGame);
  const joinGameByNumber = useMutation(api.games.joinGameByNumber);

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

  const handleJoinByNumber = async () => {
    const parsedJoinNumber = Number(joinNumber);
    if (!Number.isInteger(parsedJoinNumber) || parsedJoinNumber < 1) {
      throw new Error("Enter a valid game number");
    }

    const gameId = await joinGameByNumber({ joinNumber: parsedJoinNumber });
    if (!gameId) {
      throw new Error("No waiting game found for that number");
    }

    navigateToGame(gameId);
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
          <div className="space-y-2">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                value={joinNumber}
                onChange={(event) => setJoinNumber(event.target.value.replace(/\D/g, ""))}
                placeholder="Game number"
                className="h-11 pl-9"
                aria-label="Game number"
              />
            </div>
            <ActionButton
              variant={joinNumber ? "default" : "secondary"}
              onAction={handleJoinByNumber}
              className="h-11 w-full font-semibold"
              disabled={!joinNumber}
              label={<> <LogIn /> <span>Join by Number</span> </>}
              loadingLabel={<> <Loader2 className="animate-spin" /> <span>Joining Game...</span> </>}
              failedLabel={<> <TriangleAlert /> <span>Game not found</span> </>}
              succeededLabel={<> <Check /> <span>Joining...</span> </>}
              autoResetAfter={1600}
            />
          </div>
          <ActionButton
            variant={joinNumber ? "secondary" : "default"}
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
