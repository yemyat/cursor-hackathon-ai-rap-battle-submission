import { createThread } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

const TURN_DURATION_MS = 10_000; // 10 seconds for instructions
const MAX_ROUNDS = 3;
const POINT_FIVE = 0.5;

/**
 * Create a new battle waiting for a partner
 */
export const createBattle = mutation({
  args: {
    themeId: v.id("themes"),
  },
  returns: v.id("rapBattles"),
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

    // Get theme
    const theme = await ctx.db.get(args.themeId);
    if (!theme) {
      throw new Error("Theme not found");
    }

    // Randomly assign creator to side1 or side2
    const isCreatorSide1 = Math.random() < POINT_FIVE;
    const partner1Side = isCreatorSide1 ? theme.side1Name : theme.side2Name;
    const partner2Side = isCreatorSide1 ? theme.side2Name : theme.side1Name;

    const now = Date.now();

    // Create the battle record (waiting for partner)
    const battleId = await ctx.db.insert("rapBattles", {
      themeId: args.themeId,
      theme: theme.name,
      state: "waiting_for_partner",
      currentRound: 1,
      activeRound: 1, // Start viewing at round 1
      agent1Name: theme.side1Name,
      agent2Name: theme.side2Name,
      partner1UserId: user._id,
      partner1Side,
      partner2Side,
      waitingForPartner: true,
      createdAt: now,
      updatedAt: now,
    });

    return battleId;
  },
});

/**
 * Join a battle as the second partner
 */
export const joinBattle = mutation({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.null(),
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

    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    if (!battle.waitingForPartner) {
      throw new Error("Battle is not waiting for a partner");
    }

    if (battle.partner1UserId === user._id) {
      throw new Error("Cannot join your own battle");
    }

    if (!battle.partner2Side) {
      throw new Error("Battle is not properly configured");
    }

    // Create threads for both agents
    const agent1ThreadId = await createThread(ctx, components.agent, {
      title: `${battle.agent1Name} - ${battle.theme}`,
    });

    const agent2ThreadId = await createThread(ctx, components.agent, {
      title: `${battle.agent2Name} - ${battle.theme}`,
    });

    // Randomly determine who goes first
    const firstUserId =
      Math.random() < POINT_FIVE ? battle.partner1UserId : user._id;
    const turnStartTime = Date.now();
    const turnDeadline = turnStartTime + TURN_DURATION_MS;

    // Update battle
    await ctx.db.patch(args.battleId, {
      partner2UserId: user._id,
      agent1ThreadId,
      agent2ThreadId,
      waitingForPartner: false,
      state: "in_progress",
      currentTurnUserId: firstUserId,
      currentTurnStartTime: turnStartTime,
      currentTurnDeadline: turnDeadline,
      updatedAt: Date.now(),
    });

    // Start the battle workflow
    await ctx.scheduler.runAfter(0, internal.startBattleWorkflow.start, {
      battleId: args.battleId,
      agent1ThreadId,
      agent2ThreadId,
      partner1UserId: battle.partner1UserId,
      partner2UserId: user._id,
    });

    return null;
  },
});

/**
 * Submit instructions for current turn
 */
export const submitInstructions = mutation({
  args: {
    battleId: v.id("rapBattles"),
    instructions: v.string(),
  },
  returns: v.null(),
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

    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    // Verify it's this user's turn
    if (battle.currentTurnUserId !== user._id) {
      throw new Error("Not your turn");
    }

    // Check deadline hasn't passed
    if (battle.currentTurnDeadline && Date.now() > battle.currentTurnDeadline) {
      throw new Error("Turn deadline has passed");
    }

    // Store instructions temporarily in battle document
    await ctx.db.patch(args.battleId, {
      currentTurnUserId: undefined,
      currentTurnStartTime: undefined,
      currentTurnDeadline: undefined,
      pendingInstructions: args.instructions,
      pendingPartnerId: user._id,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Internal mutations for battle management
export const updateBattleState = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    state: v.union(
      v.literal("waiting_for_partner"),
      v.literal("preparing"),
      v.literal("in_progress"),
      v.literal("done")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.battleId, {
      state: args.state,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const incrementBattleRound = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    // Get all turns for this battle
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect();

    // Count turns in current round
    const currentRoundTurns = turns.filter(
      (t) => t.roundNumber === battle.currentRound
    );

    // If we have 2 turns in current round, move to next round
    if (currentRoundTurns.length >= 2) {
      const newRound = battle.currentRound + 1;
      await ctx.db.patch(args.battleId, {
        currentRound: newRound,
        updatedAt: Date.now(),
      });

      // Mark as done if we've completed all rounds
      if (newRound > MAX_ROUNDS) {
        await ctx.db.patch(args.battleId, {
          state: "done",
          updatedAt: Date.now(),
        });
      }
    }

    return null;
  },
});

export const saveTurn = internalMutation({
  args: {
    rapBattleId: v.id("rapBattles"),
    roundNumber: v.number(),
    turnNumber: v.number(),
    agentName: v.string(),
    partnerId: v.id("users"),
    instructions: v.string(),
    lyrics: v.string(),
    musicTrackId: v.id("musicTracks"),
    threadId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("turns", {
      rapBattleId: args.rapBattleId,
      roundNumber: args.roundNumber,
      turnNumber: args.turnNumber,
      agentName: args.agentName,
      partnerId: args.partnerId,
      instructions: args.instructions,
      instructionSubmittedAt: Date.now(),
      lyrics: args.lyrics,
      musicTrackId: args.musicTrackId,
      threadId: args.threadId,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const getBattle = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.any(),
  handler: async (ctx, args) => ctx.db.get(args.battleId),
});

export const getBattleInternal = internalQuery({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.any(),
  handler: async (ctx, args) => ctx.db.get(args.battleId),
});

export const getTurnsByBattle = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.any(),
  handler: async (ctx, args) =>
    await ctx.db
      .query("turns")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect(),
});

export const getTurnsInternal = internalQuery({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.any(),
  handler: async (ctx, args) =>
    await ctx.db
      .query("turns")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect(),
});

/**
 * List all battles
 */
export const listBattles = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const battles = await ctx.db.query("rapBattles").order("desc").collect();
    return battles;
  },
});

/**
 * Get battles for a specific theme
 */
export const getBattlesForTheme = query({
  args: {
    themeId: v.id("themes"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const battles = await ctx.db
      .query("rapBattles")
      .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
      .order("desc")
      .collect();
    return battles;
  },
});

/**
 * Get current turn info
 */
export const getCurrentTurnInfo = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      return null;
    }

    return {
      currentTurnUserId: battle.currentTurnUserId,
      currentTurnStartTime: battle.currentTurnStartTime,
      currentTurnDeadline: battle.currentTurnDeadline,
      timeRemaining: battle.currentTurnDeadline
        ? Math.max(0, battle.currentTurnDeadline - Date.now())
        : 0,
    };
  },
});

export const getMusicTrack = query({
  args: {
    trackId: v.id("musicTracks"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const track = await ctx.db.get(args.trackId);
    if (!track) {
      return null;
    }

    const storageUrl = await ctx.storage.getUrl(track.storageId);
    return {
      ...track,
      storageUrl,
    };
  },
});
