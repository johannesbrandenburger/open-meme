import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemeCanvas } from "./MemeCanvas";
import { Id } from "../../convex/_generated/dataModel";

interface VotingScreenProps {
  game: any; // From gameEngine.getGameState
  playerId: string;
}

export function VotingScreen({ game, playerId }: VotingScreenProps) {
  const [hasVotedOnCurrent, setHasVotedOnCurrent] = useState(false);
  const [clientTimeLeft, setClientTimeLeft] = useState<number>(0);

  const submitVote = useMutation(api.voting.submitVote);
  
  // Use server-controlled meme progression
  const currentMeme = game.currentVotingMeme;
  const allMemes = game.currentRoundMemes || [];
  const currentMemeIndex = game.votingMemeIndex || 0;

  const hasVoted = useQuery(api.voting.hasVoted, 
    currentMeme ? {
      voterId: playerId,
      memeId: currentMeme._id,
    } : "skip"
  );

  // Update voted status when hasVoted query result changes
  useEffect(() => {
    setHasVotedOnCurrent(hasVoted || false);
  }, [hasVoted]);

  // Reset vote status when meme changes
  useEffect(() => {
    setHasVotedOnCurrent(false);
  }, [currentMemeIndex]);

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

  const handleVote = async (vote: 1 | -1 | 0) => {
    if (!currentMeme || hasVotedOnCurrent) return;

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentMeme || allMemes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading memes...</div>
      </div>
    );
  }

  const isOwnMeme = currentMeme.playerId === playerId;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vote on Memes</h2>
            <p className="text-sm text-gray-600">
              Meme {currentMemeIndex + 1} of {allMemes.length} • Round {game.currentRound}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${clientTimeLeft <= 5 ? 'text-red-500' : 'text-blue-500'}`}>
              {formatTime(clientTimeLeft)}
            </div>
            {isOwnMeme && (
              <div className="text-sm text-purple-600 font-semibold">Your Meme</div>
            )}
            {hasVotedOnCurrent && !isOwnMeme && (
              <div className="text-sm text-green-600 font-semibold">Voted!</div>
            )}
          </div>
        </div>

        {/* Meme Display */}
        <div className="bg-white p-4">
          <MemeCanvas template={currentMeme.template} texts={currentMeme.texts} />
        </div>

        {/* Voting Buttons */}
        <div className="bg-white rounded-b-2xl p-4">
          {isOwnMeme ? (
            <div className="text-center p-4 bg-purple-100 rounded-lg">
              <p className="text-purple-700 font-semibold">This is your meme! Wait for others to vote.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
                            <button
                onClick={() => handleVote(-1)}
                disabled={hasVotedOnCurrent || clientTimeLeft === 0}
                className="flex flex-col items-center justify-center p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1">👎</span>
                <span className="text-sm font-semibold">Downvote</span>
                <span className="text-xs opacity-80">-1 point</span>
              </button>
              
              <button
                onClick={() => handleVote(0)}
                disabled={hasVotedOnCurrent || clientTimeLeft === 0}
                className="flex flex-col items-center justify-center p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1">😐</span>
                <span className="text-sm font-semibold">Skip</span>
                <span className="text-xs opacity-80">0 points</span>
              </button>
              
              <button
                onClick={() => handleVote(1)}
                disabled={hasVotedOnCurrent || clientTimeLeft === 0}
                className="flex flex-col items-center justify-center p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl mb-1">👍</span>
                <span className="text-sm font-semibold">Upvote</span>
                <span className="text-xs opacity-80">+1 point</span>
              </button>
            </div>
          )}

          {clientTimeLeft === 0 && (
            <div className="text-center mt-3 p-2 bg-yellow-100 rounded">
              <p className="text-yellow-700 text-sm">Time's up! Moving to next meme...</p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 bg-white rounded-lg p-3">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentMemeIndex + 1} / {allMemes.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentMemeIndex + 1) / allMemes.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
