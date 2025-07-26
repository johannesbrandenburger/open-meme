"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { MemeCreationScreen } from "@/app/components/MemeCreationScreen";
import { ROUNDS } from "@/convex/games";
import { VotingScreen } from "@/app/components/VotingScreen";
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