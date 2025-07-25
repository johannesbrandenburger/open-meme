"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function GameRoute() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  

}
