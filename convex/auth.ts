import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { mutation, MutationCtx, query } from "./_generated/server";
import { v } from "convex/values";
import { GenericQueryCtx } from "convex/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {

      console.log("createOrUpdateUser called with args:", args);

      const name = args.profile.email as string;
      if (!name) {
        throw new Error("Nickname is required");
      }

      // If the user already exists just update the nickname
      if (args.existingUserId) {
        await ctx.db.patch(args.existingUserId, { name: name });
        return args.existingUserId;
      }

      // Otherwise create a new user
      const newUserId = await ctx.db.insert("users", {
        name: name,
      });

      if (!newUserId) {
        throw new Error("Failed to create user");
      }

      return newUserId;
    },
  },
});