import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { FunctionReturnType } from "convex/server";
import { ThumbsUp, ThumbsDown, SkipForward, Loader2, CheckCircle, Ban } from "lucide-react";
import { useQueryWithStatus } from "@/lib/utils";
import { ActionButton } from "@/components/ui/action-button";

interface VotingScreenProps {
  game: Exclude<NonNullable<FunctionReturnType<typeof api.gamestate.getGameStateForPlayer>>, "GAME_NOT_FOUND">;
}

export function VotingScreen({ game }: VotingScreenProps) {
  const { status, data: vote, error, isSuccess, isPending, isError } = useQueryWithStatus(api.voting.userVote, { gameId: game._id });
  const submitVote = useMutation(api.voting.submitVote);

  const memeId = game.currentVotingMeme?._id;
  const template = game.currentVotingMeme?.templates[game.currentVotingMeme?.templateIndex]

  if (!template || !memeId) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading next meme...</span>
        </div>
      </div>
    );
  }

  const handleVote = async (score: 1 | 0 | -1) => {
    await submitVote({ gameId: game._id, round: game.currentRound, memeId: memeId, score });
  };

  return (
    <div className="space-y-6">

      <MemeCanvas template={template} texts={game.currentVotingMeme?.texts || []} />

      {/* Voting Interface */}
      {!game.isVotingOnOwnMeme && !vote ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="font-medium mb-4">How funny is this meme?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3">
            <ActionButton
              variant="gradient"
              onAction={() => handleVote(1)}
              className="vote-button flex flex-col items-center justify-center h-16 sm:h-20 shadow-lg transition-all duration-200"
              label={
                <>
                  <ThumbsUp className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Funny!</span>
                </>
              }
              loadingLabel={
                <>
                  <Loader2 className="w-4 h-4 animate-spin mb-1" />
                  <span className="text-sm font-medium">Voting...</span>
                </>
              }
              failedLabel={
                <>
                  <ThumbsUp className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Failed</span>
                </>
              }
              succeededLabel={
                <>
                  <CheckCircle className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Voted!</span>
                </>
              }
            />

            <ActionButton
              onAction={() => handleVote(0)}
              className="vote-button flex flex-col items-center justify-center h-16 sm:h-20 transition-all duration-200"
              variant="outline"
              label={
                <>
                  <SkipForward className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Meh</span>
                </>
              }
              loadingLabel={
                <>
                  <Loader2 className="w-4 h-4 animate-spin mb-1" />
                  <span className="text-sm font-medium">Voting...</span>
                </>
              }
              failedLabel={
                <>
                  <SkipForward className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Failed</span>
                </>
              }
              succeededLabel={
                <>
                  <CheckCircle className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Voted!</span>
                </>
              }
            />

            <ActionButton
              variant="gradient"
              onAction={() => handleVote(-1)}
              className="vote-button flex flex-col items-center justify-center h-16 sm:h-20 shadow-lg transition-all duration-200"
              label={
                <>
                  <ThumbsDown className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Not Funny</span>
                </>
              }
              loadingLabel={
                <>
                  <Loader2 className="w-4 h-4 animate-spin mb-1" />
                  <span className="text-sm font-medium">Voting...</span>
                </>
              }
              failedLabel={
                <>
                  <ThumbsDown className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Failed</span>
                </>
              }
              succeededLabel={
                <>
                  <CheckCircle className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Voted!</span>
                </>
              }
            />
          </div>
        </div>
      ) : game.isVotingOnOwnMeme ? (
        <div className="text-center py-8 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-lg font-medium">
            <Ban className="w-6 h-6" />
            <span>This is Your Meme!</span>
          </div>
          <p className="text-muted-foreground">You can't vote on your own creation.</p>
          <div className="animate-pulse flex items-center justify-center space-x-2 text-muted-foreground/80">
            <div className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-muted-foreground text-sm">Waiting for others to vote...</p>
        </div>
      ) : (
        <div className="text-center py-8 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-green-400 text-lg font-medium">
            <CheckCircle className="w-6 h-6" />
            <span>Vote Submitted!</span>
          </div>
          <p className="text-muted-foreground">Waiting for other players to vote...</p>
          <div className="animate-pulse flex items-center justify-center space-x-2 text-muted-foreground/80">
            <div className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}