import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReference, FunctionReturnType } from "convex/server";

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

  if (!meme) return <div>Loading...</div>;
  if (meme?.isSubmitted) return <div>Already submitted your meme! Let's wait for the other players to finish.</div>

  return (<>
    <MemeCanvas template={meme.templates[meme.templateIndex]} texts={meme.texts} />
    <br />
    <button onClick={() => nextShuffle({ memeId: meme._id })}>Next Shuffle</button>
    <br />
    {meme.texts.map((text, index) => (
      <input
        key={index}
        type="text"
        value={text}
        placeholder={`Text for identifier ${index + 1}`}
        onChange={(e) => {
          const newTexts = [...meme.texts];
          newTexts[index] = e.target.value;
          updateMeme({ memeId: meme._id, texts: newTexts });
        }}
      />
    ))}
    <br />
    <button onClick={() => submitMeme({ memeId: meme._id, texts: meme.texts })}>
      Submit Meme
    </button>
  </>)
}