import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReference, FunctionReturnType } from "convex/server";
import { toast } from "sonner";

/**
 * A custom hook to debounce a Convex mutation. This encapsulates the
 * timeout logic, making the component that uses it cleaner.
 * @param mutation The Convex mutation function to debounce.
 * @param delay The debounce delay in milliseconds.
 */
function useDebouncedMutation<T extends FunctionReference<"mutation">>(mutation: T, delay: number) {
  const mutationFn = useMutation(mutation);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedMutation = useCallback(
    (args: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        // Autosave is a background task; we'll log errors but not show UI.
        mutationFn(args).catch(error => {
          console.error("Autosave failed:", error);
        });
      }, delay);
    },
    [mutationFn, delay]
  );

  // Cleanup the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedMutation;
}



export function MemeCreationScreen() {
  
  return (<>
    
  </>)
}