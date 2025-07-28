"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { useState } from "react";

export function SignIn() {
    const { signIn } = useAuthActions();
    const [nickname, setNickname] = useState("");

    const handleSignIn = async () => {
        if (!nickname) {
            toast.error("Nickname is required");
            return;
        }
        void signIn("password", {
            email: nickname,
            // NOTE: this is just a workaround for anonymous users since the buildin anonymous provider does not yet meet our needs
            // we don't really need authentication, just a short nickname to identify the user
            // it must not be unique or secure
            password: "THISISADUMMYPASSWORD2025",
            flow: "signUp",
        }).then(() => {
            toast.success("Signed in successfully");
        }).catch((error) => {
            console.error("Sign in error:", error);
            toast.error("Failed to sign in: " + error.message);
        });
    };

    return (
        <div>
            <div>
                <h1>Sign In</h1>
                <input
                    className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
                    type="text"
                    name="name"
                    placeholder="Nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                />
                <button
                    className="bg-foreground text-background rounded-md"
                    onClick={handleSignIn}
                >
                    Sign in
                </button>

            </div>
        </div>
    );
}
