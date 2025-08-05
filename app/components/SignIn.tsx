"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Sticker, Loader2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";

export function SignIn() {
    const { signIn } = useAuthActions();
    const [nickname, setNickname] = useState("");

    const handleSignIn = async () => {
        if (!nickname.trim()) {
            toast.error("Please enter a nickname");
            return;
        }
        
        try {
            await signIn("password", {
                email: nickname.trim(),
                // NOTE: this is just a workaround for anonymous users since the buildin anonymous provider does not yet meet our needs
                // we don't really need authentication, just a short nickname to identify the user
                // it must not be unique or secure
                password: "THISISADUMMYPASSWORD2025",
                flow: "signUp",
            });
            toast.success("Welcome to OpenMeme!");
        } catch (error: any) {
            console.error("Sign in error:", error);
            toast.error("Failed to sign in: " + error.message);
            throw error; // Re-throw so ActionButton can handle the failed state
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && nickname.trim()) {
            handleSignIn();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Sticker className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-white mb-2">Welcome!</CardTitle>
                        <p className="text-white/80">Enter your nickname to start creating memes</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="text-white font-medium">
                            Nickname
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                            <Input
                                id="nickname"
                                type="text"
                                placeholder="Enter your nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/25 backdrop-blur-sm"
                                maxLength={20}
                            />
                        </div>
                    </div>
                    <ActionButton
                        onAction={handleSignIn}
                        disabled={!nickname.trim()}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        label="Join Game"
                        loadingLabel={
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Joining...
                            </>
                        }
                        failedLabel="Try Again"
                        succeededLabel="Joined!"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
