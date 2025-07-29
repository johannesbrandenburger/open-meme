import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, Send, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

interface MemeCreationScreenProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function MemeCreationScreen({ game }: MemeCreationScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const meme = useQuery(api.memes.getOwnMeme, { gameId: game._id })
  const updateMeme = useMutation(api.memes.updateMeme).withOptimisticUpdate(
    (localStore, args) => {
      const { memeId, texts } = args;
      const currentValue = localStore.getQuery(api.memes.getOwnMeme, { gameId: game._id });
      if (currentValue !== undefined) {
        localStore.setQuery(api.memes.getOwnMeme, { gameId: game._id }, {
          ...currentValue,
          texts: texts,
        });
      }
    }
  )
  const submitMeme = useMutation(api.memes.submitMeme);
  const nextShuffle = useMutation(api.memes.nextShuffle);

  if (!meme) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-3 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading meme template...</span>
        </div>
      </div>
    );
  }

  if (meme?.isSubmitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="flex items-center justify-center space-x-2 text-green-400 text-lg font-medium">
          <CheckCircle className="w-6 h-6" />
          <span>Meme Submitted!</span>
        </div>
        <p className="text-white/80">Waiting for other players to finish their masterpieces...</p>
        <div className="animate-pulse flex items-center justify-center space-x-2 text-white/60">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMeme({ memeId: meme._id, texts: meme.texts });
    } catch (error) {
      console.error("Failed to submit meme:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShuffle = async () => {
    setIsShuffling(true);
    try {
      await nextShuffle({ memeId: meme._id });
    } catch (error) {
      console.error("Failed to shuffle template:", error);
    } finally {
      setIsShuffling(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Meme Preview */}
      {/* <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-4 sm:pt-6"> */}
      <MemeCanvas template={meme.templates[meme.templateIndex]} texts={meme.texts} />
      {/* </CardContent> */}
      {/* </Card> */}

      {/* Template Shuffle */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={handleShuffle}
          disabled={isShuffling}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm w-full sm:w-auto"
        >
          {isShuffling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Shuffling...
            </>
          ) : (
            <>
              <Shuffle className="w-4 h-4 mr-2" />
              Try Different Template
            </>
          )}
        </Button>
      </div>

      {/* Text Inputs */}
      <div className="space-y-3 sm:space-y-4">
        {meme.texts.map((text, index) => (
          <div key={index} className="space-y-2">
            {/* <Label htmlFor={`text-${index}`} className="text-white font-medium text-sm sm:text-base">
              Text {index + 1}
            </Label> */}
            <Input
              id={`text-${index}`}
              type="text"
              value={text}
              placeholder={`Enter text for position ${index + 1}`}
              onChange={(e) => {
                const newTexts = [...meme.texts];
                newTexts[index] = e.target.value;
                updateMeme({ memeId: meme._id, texts: newTexts });
              }}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/25 backdrop-blur-sm h-12 text-base"
              maxLength={100}
            />
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || meme.texts.every(text => !text.trim())}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 font-semibold py-3 sm:py-3 h-12 sm:h-auto shadow-lg disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting Meme...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit Meme
          </>
        )}
      </Button>
    </div>
  );
}