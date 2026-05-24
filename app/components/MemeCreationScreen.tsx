import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Shuffle, Send, Loader2, CheckCircle } from "lucide-react";

interface MemeCreationScreenProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function MemeCreationScreen({ game }: MemeCreationScreenProps) {
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
      <div className="py-8 text-center">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Loading meme template...</span>
        </div>
      </div>
    );
  }

  if (meme?.isSubmitted) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-lg font-medium text-emerald-700">
          <CheckCircle className="w-6 h-6" />
          <span>Meme Submitted!</span>
        </div>
        <p className="text-muted-foreground">Waiting for other players to finish their masterpieces...</p>
        <div className="flex animate-pulse items-center justify-center gap-2">
          <div className="size-2 animate-bounce rounded-full bg-primary/50"></div>
          <div className="size-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: '0.1s' }}></div>
          <div className="size-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    try {
      await submitMeme({ memeId: meme._id, texts: meme.texts });
    } catch (error) {
      console.error("Failed to submit meme:", error);
      throw error; // Re-throw so ActionButton can handle the failed state
    }
  };

  const handleShuffle = async () => {
    try {
      await nextShuffle({ memeId: meme._id });
    } catch (error) {
      console.error("Failed to shuffle template:", error);
      throw error; // Re-throw so ActionButton can handle the failed state
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <MemeCanvas template={meme.templates[meme.templateIndex]} texts={meme.texts} />

      <div className="text-center">
        <ActionButton
          variant="outline"
          onAction={handleShuffle}
          className="w-full sm:w-auto"
          label={
            <>
              <Shuffle className="w-4 h-4" />
              Try Different Template
            </>
          }
          loadingLabel={
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Shuffling...
            </>
          }
          failedLabel={
            <>
              <Shuffle className="w-4 h-4" />
              Try Again
            </>
          }
          succeededLabel={
            <>
              <CheckCircle className="w-4 h-4" />
              Template Changed!
            </>
          }
        />
      </div>

      {/* Text Inputs */}
      <div className="space-y-3 sm:space-y-4">
        {meme.texts.map((text, index) => (
          <div key={index} className="space-y-2">
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
              className="h-12 text-base"
            />
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <ActionButton
        onAction={handleSubmit}
        disabled={meme.texts.every(text => !text.trim())}
        className="h-12 w-full font-semibold shadow-sm disabled:opacity-50"
        label={
          <>
            <Send className="w-4 h-4" />
            Submit Meme
          </>
        }
        loadingLabel={
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting Meme...
          </>
        }
        failedLabel={
          <>
            <Send className="w-4 h-4" />
            Try Again
          </>
        }
        succeededLabel={
          <>
            <CheckCircle className="w-4 h-4" />
            Meme Submitted!
          </>
        }
      />
    </div>
  );
}
