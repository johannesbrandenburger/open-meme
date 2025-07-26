"use client";

import { useConvexAuth } from "convex/react";
import { SignIn } from "@/app/components/SignIn";
import Game from "@/app/components/Game";

export default function GameRoute() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return (
      <SignIn/>
    );
  }
  return <Game/>
}