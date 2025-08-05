import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { makeUseQueryWithStatus } from "convex-helpers/react";
import { ReactMutation, useMutation, useQueries } from "convex/react";
import { FunctionReference } from "convex/server";
import { useState } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

export function useMutationWithMoreInfo<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const mut = useMutation(mutation);
  const wrappedMutation = async (...args: Parameters<ReactMutation<Mutation>>) => {
    setIsLoading(true);
    let result;
    try {
      result = await mut(...args);
    } catch (error) {
      setIsError(true);
      console.error("Mutation error:", error);
      return;
    } finally {
      setIsLoading(false);
    }
    if (!result) {
      setIsError(true);
      console.error("Mutation returned no result");
      return;
    }
    return result;
  };
  return [wrappedMutation, isLoading, isError] as const;
}