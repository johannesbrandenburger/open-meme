"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function SignIn() {
    const createUser = useMutation(api.auth.createUser);
    const { signIn } = useAuthActions();

    return (
        <div>
            <div>
                <form
                    className="flex flex-col gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        void signIn("anonymous")
                            .catch((error) => {
                                toast.error(`Sign in failed: ${error.message}`);
                                throw error;
                            })
                            .then(() => {
                                createUser({
                                    name: formData.get("name") as string,
                                })
                            });
                    }}
                >
                    <input
                        className="bg-background text-foreground rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
                        type="text"
                        name="name"
                        placeholder="Nickname"
                    />
                    <button
                        className="bg-foreground text-background rounded-md"
                        type="submit"
                    >
                        Sign in
                    </button>
                </form>

            </div>
        </div>
    );
}
