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
        <div className="flex items-center justify-center min-h-screen p-3">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-[radial-gradient(circle_at_30%_30%,color-mix(in_oklab,var(--color-primary)_60%,transparent),transparent_60%),radial-gradient(circle_at_70%_70%,color-mix(in_oklab,var(--color-accent)_50%,transparent),transparent_60%)]">
                        <Sticker className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold mb-1">Welcome!</CardTitle>
                        <p className="text-muted-foreground">Enter your nickname to start creating memes</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="font-medium">
                            Nickname
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                id="nickname"
                                type="text"
                                placeholder="Enter your nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-10"
                                maxLength={20}
                            />
                        </div>
                    </div>
                    <ActionButton
                        onAction={handleSignIn}
                        disabled={!nickname.trim()}
                        className="w-full font-semibold h-11 disabled:opacity-50 disabled:cursor-not-allowed"
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
