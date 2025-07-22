import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { Doc } from "../../convex/_generated/dataModel";

interface MemeCreationScreenProps {
  game: Doc<"games">;
  playerId: string;
}

export function MemeCreationScreen({ game, playerId }: MemeCreationScreenProps) {
  const [texts, setTexts] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds per round
  const [shufflesLeft, setShufflesLeft] = useState(3);
  const [usedTemplates, setUsedTemplates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  
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
  }, [template, texts.length]);

  // Reset timer when round changes
  useEffect(() => {
    setTimeLeft(90); // Reset to 90 seconds for new round
  }, [game.currentRound]);

  // Load existing meme if player has one
  useEffect(() => {
    if (existingMeme) {
      setTexts(existingMeme.texts);
    }
  }, [existingMeme]);

  // Timer countdown
  useEffect(() => {
    if (game.status !== "creating") return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer will be cleared when component unmounts or game status changes
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [game.status]);

  // Auto-save when time runs out
  useEffect(() => {
    if (timeLeft === 0 && game.status === "creating") {
      handleSaveMeme();
    }
  }, [timeLeft, game.status]);

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
      // The query will automatically re-run and get a new template
    }
  };

  const handleSaveMeme = async () => {
    if (!template) return;
    
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      await saveMeme({
        gameId: game.gameId,
        playerId,
        templateName: template.name,
        texts,
      });
      
      setSaveMessage("Meme saved successfully! ✅");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save meme:", error);
      setSaveMessage("Failed to save meme. Please try again. ❌");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

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
            <div className="text-2xl font-bold text-red-500">{formatTime(timeLeft)}</div>
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
            />
          ))}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-b-2xl p-4 space-y-3">
          {saveMessage && (
            <div className={`text-center p-2 rounded ${
              saveMessage.includes('✅') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {saveMessage}
            </div>
          )}
          
          <button
            onClick={handleShuffle}
            disabled={shufflesLeft === 0}
            className="w-full bg-yellow-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎲 Shuffle Template ({shufflesLeft} left)
          </button>
          
          <button
            onClick={handleSaveMeme}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "💾 Saving..." : "💾 Save Meme"}
          </button>
        </div>
      </div>
    </div>
  );
}
