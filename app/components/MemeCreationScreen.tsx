import { useState, useEffect, useCallback } from "react";
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
  const [texts, setTexts] = useState<string[]>([]);
  const [shufflesLeft, setShufflesLeft] = useState(5);
  const [usedTemplates, setUsedTemplates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [clientTimeLeft, setClientTimeLeft] = useState<number>(0);
  
  // Get a random meme template
  const template = useQuery(api.memes.getRandomMemeTemplate, { 
    excludeTemplates: usedTemplates
  });
  
  // Check if player already has a meme for this round
  const existingMeme = useQuery(api.memes.getPlayerMeme, {
    gameId: game.gameId,
    playerId,
    round: game.currentRound,
  });
  
  // Mutation to save the meme
  const saveMeme = useMutation(api.memes.saveMeme);

  // Initialize texts array when template changes
  useEffect(() => {
    if (template && texts.length === 0) {
      setTexts(new Array(template.text.length).fill(""));
    }
  }, [template]);

  // Reset state when round changes
  useEffect(() => {
    setShufflesLeft(3);
    setUsedTemplates([]);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTextChange = (index: number, value: string) => {
    const newTexts = [...texts];
    newTexts[index] = value;
    setTexts(newTexts);
  };

  const handleShuffle = () => {
    if (shufflesLeft > 0 && template) {
      setShufflesLeft(prev => prev - 1);
      setUsedTemplates(prev => [...prev, template.name]);
      setTexts([]); // Clear texts when shuffling
    }
  };

  const handleSaveMeme = useCallback(async () => {
    if (!template) return;
    
    setIsSaving(true);
    
    try {
      await saveMeme({
        gameId: game.gameId,
        playerId,
        templateName: template.name,
        texts,
      });
      
      toast.success("Meme saved successfully!");
    } catch (error) {
      console.error("Failed to save meme:", error);
      toast.error("Failed to save meme. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [template, game.gameId, playerId, texts, saveMeme]);

  // Auto-save when time runs out (use client timer for responsiveness)
  useEffect(() => {
    if (clientTimeLeft === 0 && game.status === "creating" && texts.some(t => t.trim())) {
      handleSaveMeme();
    }
  }, [clientTimeLeft, game.status, texts, handleSaveMeme]);

  if (!template) {
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
              placeholder={`Text ${index + 1}`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              maxLength={50}
              disabled={clientTimeLeft === 0}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-b-2xl p-4 space-y-3">
          
          <button
            onClick={handleShuffle}
            disabled={shufflesLeft === 0 || clientTimeLeft === 0}
            className="w-full bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎲 Shuffle Template ({shufflesLeft} left)
          </button>
          
          <button
            onClick={handleSaveMeme}
            disabled={isSaving || clientTimeLeft === 0}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "💾 Saving..." : "💾 Save Meme"}
          </button>

          {clientTimeLeft === 0 && (
            <div className="text-center p-4 bg-yellow-100 rounded-lg">
              <p className="text-yellow-700 font-semibold">Time's up! Waiting for other players...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
