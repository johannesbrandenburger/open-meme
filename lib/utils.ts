import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
