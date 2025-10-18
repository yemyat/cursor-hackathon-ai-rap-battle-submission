import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, query } from "./_generated/server";

/**
 * Get current user from Clerk auth (returns null if not synced yet)
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkUserId: v.string(),
      username: v.string(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find existing user
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    return existing ?? null;
  },
});

/**
 * Get user by ID
 */
export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkUserId: v.string(),
      username: v.string(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => await ctx.db.get(args.userId),
});

/**
 * Upsert user from Clerk webhook
 */
export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkId))
      .first();

    // Generate username from available data
    const username =
      args.firstName && args.lastName
        ? `${args.firstName} ${args.lastName}`
        : args.firstName ||
          args.email?.split("@")[0] ||
          `User${args.clerkId.slice(-6)}`;

    if (existing) {
      await ctx.db.patch(existing._id, { username });
      return existing._id;
    }

    const userId: Id<"users"> = await ctx.db.insert("users", {
      clerkUserId: args.clerkId,
      username,
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Delete user from Clerk webhook
 */
export const deleteUser = internalMutation({
  args: {
    clerkId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }

    return null;
  },
});
