import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { Id } from "../../convex/_generated/dataModel";

interface VotingScreenProps {
  game: any;
  playerId: string;
}

export function VotingScreen({ game, playerId }: VotingScreenProps) {
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasVotedOnCurrent, setHasVotedOnCurrent] = useState(false);

  const roundMemes = useQuery(api.memes.getRoundMemes, {
    gameId: game.gameId,
    round: game.currentRound,
  });

  const submitVote = useMutation(api.voting.submitVote);
  const hasVoted = useQuery(api.voting.hasVoted, 
    roundMemes && roundMemes[currentMemeIndex] ? {
      voterId: playerId,
      memeId: roundMemes[currentMemeIndex]._id,
    } : "skip"
  );

  // Update voted status when hasVoted query result changes
  useEffect(() => {
    setHasVotedOnCurrent(hasVoted || false);
  }, [hasVoted]);

  // Timer for each meme
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextMeme();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentMemeIndex]);

  const progressGame = useMutation(api.games.progressGame);

  const handleNextMeme = () => {
    if (roundMemes && currentMemeIndex < roundMemes.length - 1) {
      setCurrentMemeIndex(prev => prev + 1);
      setTimeLeft(30);
    } else {
      // All memes have been shown, progress to results
      progressGame({ gameId: game.gameId });
    }
  };

  const handleVote = async (vote: 1 | -1 | 0) => {
    if (!roundMemes || hasVotedOnCurrent) return;

    const currentMeme = roundMemes[currentMemeIndex];
    if (currentMeme.playerId === playerId) return; // Can't vote on own meme

    try {
      await submitVote({
        gameId: game.gameId,
        round: game.currentRound,
        voterId: playerId,
        memeId: currentMeme._id as Id<"memes">,
        vote,
      });
      setHasVotedOnCurrent(true);
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  if (!roundMemes || roundMemes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading memes...</div>
      </div>
    );
  }

  const currentMeme = roundMemes[currentMemeIndex];
  const isOwnMeme = currentMeme.playerId === playerId;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vote on Memes</h2>
            <p className="text-sm text-gray-600">
              Meme {currentMemeIndex + 1} of {roundMemes.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-500">{timeLeft}s</div>
            <div className="text-sm text-gray-600">Time left</div>
          </div>
        </div>

        {/* Meme Display */}
        <div className="bg-white p-4">
          <MemeCanvas 
            template={currentMeme.template} 
            texts={currentMeme.texts} 
          />
        </div>

        {/* Voting Buttons */}
        <div className="bg-white rounded-b-2xl p-4">
          {isOwnMeme ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600 mb-2">This is your meme!</p>
              <p className="text-sm text-gray-500">You cannot vote on your own creation</p>
            </div>
          ) : hasVotedOnCurrent ? (
            <div className="text-center py-8">
              <p className="text-lg text-green-600 mb-2">✅ Vote submitted!</p>
              <p className="text-sm text-gray-500">Waiting for next meme...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleVote(-1)}
                className="bg-red-500 text-white font-semibold py-4 px-6 rounded-lg hover:bg-red-600 transition-all transform hover:scale-105"
              >
                👎<br />Downvote<br />(-1)
              </button>
              <button
                onClick={() => handleVote(0)}
                className="bg-gray-500 text-white font-semibold py-4 px-6 rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105"
              >
                😐<br />Skip<br />(0)
              </button>
              <button
                onClick={() => handleVote(1)}
                className="bg-green-500 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105"
              >
                👍<br />Upvote<br />(+1)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
