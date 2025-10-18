import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Send a cheer (applause/boo/fire) - cheerleaders only
 */
export const sendCheer = mutation({
  args: {
    battleId: v.id("rapBattles"),
    agentName: v.string(),
    cheerType: v.union(
      v.literal("applause"),
      v.literal("boo"),
      v.literal("fire")
    ),
  },
  returns: v.id("cheers"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get battle to check if user is a rapping partner
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    // Verify user is NOT a rapping partner (cheerleaders only)
    if (
      user._id === battle.partner1UserId ||
      user._id === battle.partner2UserId
    ) {
      throw new Error("Rapping partners cannot send cheers");
    }

    // Create the cheer
    const cheerId = await ctx.db.insert("cheers", {
      battleId: args.battleId,
      userId: user._id,
      agentName: args.agentName,
      cheerType: args.cheerType,
      timestamp: Date.now(),
      roundNumber: battle.currentRound,
    });

    return cheerId;
  },
});

/**
 * Get all cheers for a battle
 */
export const getCheersForBattle = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.array(
    v.object({
      _id: v.id("cheers"),
      _creationTime: v.number(),
      battleId: v.id("rapBattles"),
      userId: v.id("users"),
      agentName: v.string(),
      cheerType: v.union(
        v.literal("applause"),
        v.literal("boo"),
        v.literal("fire")
      ),
      timestamp: v.number(),
      roundNumber: v.number(),
      username: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const cheers = await ctx.db
      .query("cheers")
      .withIndex("by_battle_and_time", (q) => q.eq("battleId", args.battleId))
      .order("desc")
      .collect();

    // Enrich with usernames
    type EnrichedCheerAll = (typeof cheers)[0] & { username: string };
    const enrichedCheers: EnrichedCheerAll[] = [];
    for (const cheer of cheers) {
      const user = await ctx.db.get(cheer.userId);
      enrichedCheers.push({
        ...cheer,
        username: user?.username || "Unknown",
      });
    }

    return enrichedCheers;
  },
});

/**
 * Get recent cheers (last 10)
 */
export const getRecentCheers = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.array(
    v.object({
      _id: v.id("cheers"),
      _creationTime: v.number(),
      battleId: v.id("rapBattles"),
      userId: v.id("users"),
      agentName: v.string(),
      cheerType: v.union(
        v.literal("applause"),
        v.literal("boo"),
        v.literal("fire")
      ),
      timestamp: v.number(),
      roundNumber: v.number(),
      username: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const cheers = await ctx.db
      .query("cheers")
      .withIndex("by_battle_and_time", (q) => q.eq("battleId", args.battleId))
      .order("desc")
      .take(10);

    // Enrich with usernames
    type EnrichedRecentCheer = (typeof cheers)[0] & { username: string };
    const enrichedCheers: EnrichedRecentCheer[] = [];
    for (const cheer of cheers) {
      const user = await ctx.db.get(cheer.userId);
      enrichedCheers.push({
        ...cheer,
        username: user?.username || "Unknown",
      });
    }

    return enrichedCheers;
  },
});

/**
 * Get cheer stats (counts per type)
 */
export const getCheerStats = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.object({
    applause: v.number(),
    boo: v.number(),
    fire: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const cheers = await ctx.db
      .query("cheers")
      .withIndex("by_battle_and_time", (q) => q.eq("battleId", args.battleId))
      .collect();

    const stats = {
      applause: 0,
      boo: 0,
      fire: 0,
      total: cheers.length,
    };

    for (const cheer of cheers) {
      stats[cheer.cheerType] += 1;
    }

    return stats;
  },
});
