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
  
  return <Game />;
}