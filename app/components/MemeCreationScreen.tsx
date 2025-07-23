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

interface MemeCreationScreenProps {
  game: NonNullable<FunctionReturnType<typeof api.games.getGameState>>;
  playerId: string;
}

export function MemeCreationScreen({ game, playerId }: MemeCreationScreenProps) {
  // --- State Management ---

  const [shufflesLeft, setShufflesLeft] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientTimeLeft, setClientTimeLeft] = useState(game.timeLeft);

  // Core state for the meme being created. `null` indicates it's not yet initialized.
  const [template, setTemplate] =
    useState<typeof game.playerTemplates[0] | null>(null);
  const [texts, setTexts] = useState<string[] | null>(null);
  const [templateIndex, setTemplateIndex] = useState(0);

  // Ref to prevent re-initializing state from the server within the same round.
  // This is the key to preventing user input from being overwritten.
  const hasInitialized = useRef(false);

  // --- Convex Hooks ---

  const existingMeme = useQuery(api.memes.getPlayerMeme, {
    gameId: game.gameId,
    playerId,
    round: game.currentRound,
  });

  const saveMeme = useMutation(api.memes.saveMeme);
  const submitMeme = useMutation(api.memes.submitMeme);
  const debouncedSaveMeme = useDebouncedMutation(api.memes.saveMeme, 500);

  // --- Effects ---

  // Effect 1: Reset component state when the game round changes.
  useEffect(() => {
    hasInitialized.current = false;
    setShufflesLeft(5);
    setTexts(null); // Clear texts to show a loading state
    setTemplate(null); // Clear template
    setClientTimeLeft(game.timeLeft); // Re-sync timer with the server
  }, [game.currentRound, game.timeLeft]);

  // Effect 2: Initialize component state from server data.
  // Runs once per round after data is loaded. It loads a saved meme or
  // sets up a new one without overwriting active user input later.
  useEffect(() => {
    const templates = game.playerTemplates;
    if (
      hasInitialized.current ||
      !templates ||
      templates.length === 0 ||
      existingMeme === undefined
    ) {
      return;
    }

    let initialTemplate: typeof templates[0];
    let initialTexts: string[];
    let initialTemplateIndex = 0;

    if (existingMeme) {
      // Player has a saved meme for this round; load it.
      const savedIdx = templates.findIndex(
        t => t.name === existingMeme.templateName
      );
      if (savedIdx !== -1) {
        initialTemplateIndex = savedIdx;
        initialTemplate = templates[savedIdx];
      } else {
        initialTemplate = templates[0]; // Fallback
      }
      initialTexts = existingMeme.texts;
    } else {
      // No saved meme; start with the first template.
      initialTemplate = templates[0];
      initialTexts =
        initialTemplate.example ||
        new Array(initialTemplate.text.length).fill("");
    }

    setTemplate(initialTemplate);
    setTemplateIndex(initialTemplateIndex);
    setTexts(initialTexts);
    hasInitialized.current = true; // Mark as initialized for this round
  }, [game.playerTemplates, existingMeme, game.currentRound]);

  // Effect 3: Client-side countdown timer for UI responsiveness.
  useEffect(() => {
    if (clientTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setClientTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [clientTimeLeft]);

  // Effect 4: Autosave user progress on text change.
  useEffect(() => {
    if (
      !hasInitialized.current ||
      !template ||
      !texts ||
      existingMeme?.submitted ||
      texts.every(t => !t.trim())
    ) {
      return;
    }

    debouncedSaveMeme({
      gameId: game.gameId,
      playerId,
      templateName: template.name,
      texts,
    });
  }, [texts, template, game.gameId, playerId, debouncedSaveMeme, existingMeme]);

  // --- Event Handlers ---

  const handleTextChange = (index: number, value: string) => {
    if (!texts || existingMeme?.submitted) return;
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const handleShuffle = useCallback(() => {
    if (
      shufflesLeft <= 0 ||
      existingMeme?.submitted ||
      !game.playerTemplates
    ) {
      return;
    }

    setShufflesLeft(prev => prev - 1);
    const nextIndex = (templateIndex + 1) % game.playerTemplates.length;
    const nextTemplate = game.playerTemplates[nextIndex];

    setTemplateIndex(nextIndex);
    setTemplate(nextTemplate);
    setTexts(
      nextTemplate.example || new Array(nextTemplate.text.length).fill("")
    );
  }, [shufflesLeft, templateIndex, game.playerTemplates, existingMeme]);

  const handleSubmitMeme = useCallback(async () => {
    if (!template || !texts || existingMeme?.submitted) return;

    setIsSubmitting(true);
    try {
      // Explicitly save final state before submitting to prevent race conditions.
      await saveMeme({
        gameId: game.gameId,
        playerId,
        templateName: template.name,
        texts,
      });

      await submitMeme({ gameId: game.gameId, playerId });

      toast.success("Meme submitted successfully!");
    } catch (error) {
      console.error("Failed to submit meme:", error);
      toast.error("Failed to submit meme. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [template, texts, game.gameId, playerId, saveMeme, submitMeme, existingMeme]);

  // --- Render Logic ---

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Show a loading state until the component is initialized.
  if (!template || !texts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading meme template...</div>
      </div>
    );
  }

  const isTimeUp = clientTimeLeft === 0;
  const isSubmitted = existingMeme?.submitted === true;
  const canInteract = !isTimeUp && !isSubmitted;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Create Your Meme
            </h2>
            <p className="text-sm text-gray-600">
              Round {game.currentRound} of {game.totalRounds}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${isTimeUp || clientTimeLeft <= 10
                  ? "text-red-500"
                  : "text-green-500"
                }`}
            >
              {formatTime(clientTimeLeft)}
            </div>
            <div className="text-sm text-gray-600">
              Shuffles: {shufflesLeft}
            </div>
          </div>
        </div>

        {/* Meme Canvas */}
        <div className="bg-white p-4">
          <MemeCanvas template={template} texts={texts} />
        </div>

        {/* Text Inputs */}
        <div className="bg-white p-4 space-y-3">
          {texts.map((text, index) => (
            <input
              key={index}
              type="text"
              value={text}
              onChange={e => handleTextChange(index, e.target.value)}
              onFocus={e => e.target.select()}
              placeholder={`Text ${index + 1}`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
              disabled={!canInteract}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-b-2xl p-4 space-y-3">
          <button
            onClick={handleShuffle}
            disabled={!canInteract || shufflesLeft === 0}
            className="w-full bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎲 Shuffle Template ({shufflesLeft} left)
          </button>

          {!isSubmitted ? (
            <button
              onClick={handleSubmitMeme}
              disabled={
                !canInteract || isSubmitting || texts.every(t => !t.trim())
              }
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Meme"}
            </button>
          ) : (
            <div className="w-full bg-green-100 text-green-700 font-semibold py-3 px-6 rounded-lg text-center">
              Meme Submitted! Waiting for other players...
            </div>
          )}

          {isTimeUp && !isSubmitted && (
            <div className="text-center p-4 bg-yellow-100 rounded-lg">
              <p className="text-yellow-700 font-semibold">
                Time's up! Your meme was auto-saved.
              </p>
            </div>
          )}

          {canInteract && (
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-blue-600 text-sm">
                💾 Auto-saving as you type...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}