import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface HomePageProps {
  playerId: string;
  onNavigateToGame: (gameId: string) => void;
}

export function HomePage({ playerId, onNavigateToGame }: HomePageProps) {
  const [nickname, setNickname] = useState(() => 
    localStorage.getItem("openmeme-nickname") || ""
  );
  const [isCreating, setIsCreating] = useState(false);

  const createGame = useMutation(api.games.createGame);

  const handleCreateGame = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    setIsCreating(true);
    try {
      localStorage.setItem("openmeme-nickname", nickname.trim());
      const result = await createGame({
        hostId: playerId,
        nickname: nickname.trim(),
      });

      // Copy game link to clipboard with fallback for iOS
      const gameUrl = `${window.location.origin}/game/${result.gameId}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(gameUrl);
          toast.success("Game created! Link copied to clipboard");
        } else {
          // Fallback for older browsers or when clipboard API is not available
          const textArea = document.createElement("textarea");
          textArea.value = gameUrl;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          toast.success("Game created! Link copied to clipboard");
        }
      } catch (clipboardError) {
        // If clipboard fails, still show success but inform user to copy manually
        console.warn("Clipboard copy failed:", clipboardError);
        toast.success("Game created! Please copy the URL from your browser");
      }

      onNavigateToGame(result.gameId);
    } catch (error) {
      toast.error("Failed to create game");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">OpenMeme</h1>
          <p className="text-gray-600">The open source meme game</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Your Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleCreateGame}
            disabled={isCreating || !nickname.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isCreating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Game...
              </div>
            ) : (
              "Create Game"
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Share the game link with friends to play together!
          </p>
        </div>
      </div>
    </div>
  );
}
