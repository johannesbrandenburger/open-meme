"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Sticker, Loader2, TriangleAlert, Check } from "lucide-react";
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
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-md border-border/80 shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <Sticker className="size-10" />
                    </div>
                    <div>
                        <CardTitle className="mb-2 text-3xl font-semibold">Welcome to OpenMeme</CardTitle>
                        <p className="text-sm text-muted-foreground">Pick a nickname to join the table.</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="nickname" className="font-medium">
                            Nickname
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="nickname"
                                type="text"
                                placeholder="Enter your nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="h-11 pl-10"
                                maxLength={20}
                            />
                        </div>
                    </div>
                    <ActionButton
                        onAction={handleSignIn}
                        disabled={!nickname.trim()}
                        className="h-11 w-full font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        label="Join"
                        loadingLabel={
                            <>
                                <Loader2 className="animate-spin" />
                                Joining...
                            </>
                        }
                        failedLabel={
                            <>
                                <TriangleAlert />
                                Try Again
                            </>
                        }
                        succeededLabel={
                            <>
                                <Check />
                                Joined
                            </>
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
