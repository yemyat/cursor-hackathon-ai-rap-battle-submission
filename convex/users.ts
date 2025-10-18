import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";

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
 * Sync/update user data from Clerk
 */
export const syncUser = mutation({
  args: {
    username: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existing) {
      // Update username if provided
      if (args.username) {
        await ctx.db.patch(existing._id, { username: args.username });
      }
      return existing._id;
    }

    // Create new user
    const username =
      args.username ||
      identity.nickname ||
      identity.name ||
      identity.email?.split("@")[0] ||
      "Anonymous";
    const userId: Id<"users"> = await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      username,
      createdAt: Date.now(),
    });

    return userId;
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
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkId))
      .first();

    const username =
      args.firstName ||
      args.email?.split("@")[0] ||
      "Anonymous";

    if (existing) {
      await ctx.db.patch(existing._id, { username });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkId,
      username,
      createdAt: Date.now(),
    });
  },
});

/**
 * Delete user from Clerk webhook
 */
export const deleteUser = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
