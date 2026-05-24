"use client";

import { useConvexAuth } from "convex/react";
import { SignIn } from "@/app/components/SignIn";
import Game from "@/app/components/Game";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function GameRoute() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md border-border/80 shadow-md">
          <CardContent>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Loading game...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <SignIn />;
  }
  
  return <Game />;
}
