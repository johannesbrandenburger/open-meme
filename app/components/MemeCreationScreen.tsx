import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { Doc } from "../../convex/_generated/dataModel";
import { FunctionReturnType } from "convex/server"; // Import this utility
import { toast } from "sonner";

interface MemeCreationScreenProps {
  game: NonNullable<FunctionReturnType<typeof api.games.getGameState>>;
  playerId: string;
}

export function MemeCreationScreen({ game, playerId }: MemeCreationScreenProps) {
  const [shufflesLeft, setShufflesLeft] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientTimeLeft, setClientTimeLeft] = useState<number>(0);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get a random meme template
  const [template, setTemplate] = useState<typeof game.playerTemplates[0] | null>(null);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [texts, setTexts] = useState<string[]>([]);

  // Initialize template and texts when game.playerTemplates is available
  useEffect(() => {
    if (game.playerTemplates && game.playerTemplates.length > 0 && !template) {
      const initialTemplate = game.playerTemplates[0];
      setTemplate(initialTemplate);
      setTexts(initialTemplate.example || new Array(initialTemplate.text.length).fill(""));
    }
  }, [game.playerTemplates, template]);

  // Check if player already has a meme for this round
  const existingMeme = useQuery(api.memes.getPlayerMeme, {
    gameId: game.gameId,
    playerId,
    round: game.currentRound,
  });
  
  // Mutation to save the meme (autosave)
  const saveMeme = useMutation(api.memes.saveMeme);
  
  // Mutation to submit the meme
  const submitMeme = useMutation(api.memes.submitMeme);

  // Initialize texts array when template changes
  useEffect(() => {
    if (template && template.text) {
      setTexts(template.example || new Array(template.text.length).fill(""));
    }
  }, [template]);

  // Reset state when round changes
  useEffect(() => {
    setShufflesLeft(5);
    setTexts([]);
  }, [game.currentRound]);

  // Update client timer when server timer changes
  useEffect(() => {
    setClientTimeLeft(game.timeLeft);
  }, [game.timeLeft]);

  // Client-side countdown timer
  useEffect(() => {
    // Only start timer if we have time left
    if (clientTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setClientTimeLeft(prev => {
        const newTime = Math.max(0, prev - 1);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [clientTimeLeft > 0]); // Restart timer when we transition from 0 to >0 time

  // Load existing meme if player has one
  useEffect(() => {
    if (existingMeme) {
      setTexts(existingMeme.texts);
    }
  }, [existingMeme]);

  // Autosave function
  const autoSave = useCallback(async () => {
    if (!template || texts.every(t => !t.trim())) return;
    
    try {
      await saveMeme({
        gameId: game.gameId,
        playerId,
        templateName: template.name,
        texts,
      });
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  }, [template, game.gameId, playerId, texts, saveMeme]);

  // Auto-save with debouncing when texts change
  useEffect(() => {
    // Don't autosave if meme is already submitted
    if (existingMeme?.submitted) return;
    
    // Clear existing timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }
    
    // Set new timeout for autosave (500ms debounce)
    autosaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 500);
    
    // Cleanup timeout on unmount
    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [texts, autoSave, existingMeme?.submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextChange = (index: number, value: string) => {
    // Don't allow changes if meme is submitted
    if (existingMeme?.submitted) return;
    
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const handleShuffle = () => {
    // Don't allow shuffle if meme is submitted
    if (existingMeme?.submitted) return;
    
    if (shufflesLeft > 0 && game.playerTemplates && game.playerTemplates.length > 0) {
      setShufflesLeft(prev => prev - 1);
      const nextIndex = (templateIndex + 1) % game.playerTemplates.length;
      const nextTemplate = game.playerTemplates[nextIndex];
      setTemplate(nextTemplate);
      setTemplateIndex(nextIndex);
      setTexts(new Array(nextTemplate.text.length).fill("")); // Initialize with correct length
    }
  };

  const handleSubmitMeme = useCallback(async () => {
    if (!template || existingMeme?.submitted) return;
    
    setIsSubmitting(true);
    
    try {
      // First, save the current state
      await saveMeme({
        gameId: game.gameId,
        playerId,
        templateName: template.name,
        texts,
      });
      
      // Then submit the meme
      await submitMeme({
        gameId: game.gameId,
        playerId,
      });
      
      toast.success("Meme submitted successfully!");
    } catch (error) {
      console.error("Failed to submit meme:", error);
      toast.error("Failed to submit meme. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [template, game.gameId, playerId, texts, saveMeme, submitMeme, existingMeme?.submitted]);

  // Auto-save when time runs out (use client timer for responsiveness)
  useEffect(() => {
    if (clientTimeLeft === 0 && game.status === "creating" && texts.some(t => t.trim()) && !existingMeme?.submitted) {
      autoSave();
    }
  }, [clientTimeLeft, game.status, texts, autoSave, existingMeme?.submitted]);

  if (!template || !game.playerTemplates || game.playerTemplates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading meme template...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Create Your Meme</h2>
            <p className="text-sm text-gray-600">Round {game.currentRound} of {game.totalRounds}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${clientTimeLeft <= 10 ? 'text-red-500' : 'text-green-500'}`}>
              {formatTime(clientTimeLeft)}
            </div>
            <div className="text-sm text-gray-600">Shuffles: {shufflesLeft}</div>
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
              onChange={(e) => handleTextChange(index, e.target.value)}
              onFocus={e => e.target.select()}
              placeholder={`Text ${index + 1}`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100"
              disabled={clientTimeLeft === 0 || existingMeme?.submitted}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-b-2xl p-4 space-y-3">
          
          <button
            onClick={handleShuffle}
            disabled={shufflesLeft === 0 || clientTimeLeft === 0 || existingMeme?.submitted}
            className="w-full bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎲 Shuffle Template ({shufflesLeft} left)
          </button>
          
          {!existingMeme?.submitted ? (
            <button
              onClick={handleSubmitMeme}
              disabled={isSubmitting || clientTimeLeft === 0 || texts.every(t => !t.trim())}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "� Submitting..." : "� Submit Meme"}
            </button>
          ) : (
            <div className="w-full bg-green-100 text-green-700 font-semibold py-3 px-6 rounded-lg text-center">
              ✅ Meme Submitted! Waiting for other players...
            </div>
          )}

          {clientTimeLeft === 0 && !existingMeme?.submitted && (
            <div className="text-center p-4 bg-yellow-100 rounded-lg">
              <p className="text-yellow-700 font-semibold">Time's up! Your meme was auto-saved. Waiting for other players...</p>
            </div>
          )}
          
          {clientTimeLeft > 0 && !existingMeme?.submitted && (
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-blue-600 text-sm">💾 Auto-saving as you type...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
