import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReference, FunctionReturnType } from "convex/server";
import { Id } from "@/convex/_generated/dataModel";

interface VotingScreenProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function VotingScreen({ game }: VotingScreenProps) {

  const vote = useQuery(api.voting.userVote, { gameId: game._id, round: game.currentRound });
  const submitVote = useMutation(api.voting.submitVote)
  // .withOptimisticUpdate(
  //   (localStore, args) => {
  //     const { gameId, round, memeId, score } = args;
  //     const currentValue = localStore.getQuery(api.voting.userVote, { gameId: game._id, round: game.currentRound });
  //     if (currentValue !== undefined) {
  //       localStore.setQuery(api.voting.userVote, { gameId: game._id, round: game.currentRound }, {
  //         memeId: memeId,
  //         gameId: gameId,
  //         round: round,
  //         score: score,
  //         userId: game.currentPlayer,
  //         _id: crypto.randomUUID() as Id<"votes">,
  //         _creationTime: Date.now(),
  //         createdAt: (new Date()).getTime(),
  //       });
  //     }
  //   }
  // )

  const memeId = game.currentVotingMeme?._id;
  const template = game.currentVotingMeme?.templates[game.currentVotingMeme?.templateIndex]
  if (!template || !memeId) return <div>Loading...</div>;

  return (<>
    <MemeCanvas template={template} texts={game.currentVotingMeme?.texts || []} />
    <br />
    {/* submit vote buttons */}
    {!game.isVotingOnOwnMeme && (<>
      <button
        onClick={() => submitVote({ gameId: game._id, round: game.currentRound, memeId: memeId, score: 1 })}
      >Upvote</button>
      <button
        onClick={() => submitVote({ gameId: game._id, round: game.currentRound, memeId: memeId, score: 0 })}
      >Skip</button>
      <button
        onClick={() => submitVote({ gameId: game._id, round: game.currentRound, memeId: memeId, score: -1 })}
      >Downvote</button>
    </>)}
    <br />
    {game.isVotingOnOwnMeme && (<>
      <p>You cannot vote on your own meme.</p>
      <p>Waiting for other players to vote...</p>
    </>)}
    <br />
    {vote && (<>
      Thanks for voting!<br />
    </>
    )}
  </>)
}