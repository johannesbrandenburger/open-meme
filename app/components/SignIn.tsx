"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function SignIn() {
    const createUser = useMutation(api.auth.createUser);
    const [name, setName] = useState("");

    const handleSignIn = async () => {
        if (!name.trim()) {
            toast.error("Please enter a name");
            return;
        }

        try {
            await createUser({ name: name.trim() });
            toast.success("Signed in successfully!");
            // Redirect or perform any other action after successful sign-in
        } catch (error: any) {
            toast.error(error.message || "Failed to sign in");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Sign In</h1>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                />
                <button
                    onClick={handleSignIn}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Sign In
                </button>
            </div>
        </div>
    );
}
