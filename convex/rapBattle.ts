import { google } from "@ai-sdk/google";
import { createThread, listUIMessages, saveMessage } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { createRapAgent } from "./agents/rapAgent";

const TURN_DURATION_MS = 10_000; // 10 seconds for instructions
const MAX_ROUNDS = 3;
const POINT_FIVE = 0.5;

// Create a new rap battle thread
export const createBattleThread = mutation({
  args: {
    title: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const threadId = await createThread(ctx, components.agent, {
      title: args.title ?? "Rap Battle",
    });
    return threadId;
  },
});

export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const paginated = await listUIMessages(ctx, components.agent, args);

    // Here you could filter out / modify the documents
    return paginated;
  },
});

// Drop a first verse with a single agent
export const takeTurn = internalAction({
  args: {
    threadId: v.optional(v.string()),
    agentName: v.string(),
    prompt: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, { threadId, agentName, prompt }) => {
    // Create a thread if one wasn't provided
    const actualThreadId =
      threadId ??
      (await createThread(ctx, components.agent, {
        title: `${agentName}'s Verse`,
      }));

    // Create the rap agent
    const agent = createRapAgent(
      ctx,
      agentName,
      google("gemini-2.5-flash-lite-preview-09-2025")
    );

    // Save the initial prompt message
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: actualThreadId,
      prompt: prompt ?? "Drop your first verse and show us what you got!",
    });

    // Generate the first verse
    await agent.generateText(
      ctx,
      { threadId: actualThreadId },
      { promptMessageId: messageId }
    );

    // Fetch and return all messages from the thread
    const messagesResult = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId: actualThreadId,
        order: "desc",
        paginationOpts: { numItems: 50, cursor: null },
      }
    );

    return messagesResult;
  },
});

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

    // Schedule timeout enforcement
    await ctx.scheduler.runAfter(
      TURN_DURATION_MS,
      internal.rapBattle.checkTurnTimeout,
      {
        battleId: args.battleId,
        expectedUserId: firstUserId,
        deadline: turnDeadline,
      }
    );

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

    // Trigger agent generation
    const agentName =
      user._id === battle.partner1UserId
        ? battle.partner1Side
        : battle.partner2Side;
    const threadId =
      agentName === battle.agent1Name
        ? battle.agent1ThreadId
        : battle.agent2ThreadId;

    if (!threadId) {
      throw new Error("Thread not initialized");
    }

    // Get previous lyrics if any
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect();

    const previousTurn = turns
      .filter((t) => t.agentName !== agentName)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    await ctx.scheduler.runAfter(0, internal.rapBattle.executeRound, {
      battleId: args.battleId,
      agentName: agentName ?? "",
      threadId,
      roundNumber: battle.currentRound,
      previousLyrics: previousTurn?.lyrics ?? null,
      instructions: args.instructions,
      partnerId: user._id,
    });

    return null;
  },
});

/**
 * Check if turn timed out and auto-submit empty instructions
 */
export const checkTurnTimeout = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    expectedUserId: v.id("users"),
    deadline: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      return null;
    }

    // Check if turn is still active and deadline matches
    if (
      battle.currentTurnUserId === args.expectedUserId &&
      battle.currentTurnDeadline === args.deadline
    ) {
      // Timeout occurred, auto-submit empty instructions
      await ctx.db.patch(args.battleId, {
        currentTurnUserId: undefined,
        currentTurnStartTime: undefined,
        currentTurnDeadline: undefined,
        pendingInstructions: "",
        pendingPartnerId: args.expectedUserId,
        updatedAt: Date.now(),
      });

      const agentName =
        args.expectedUserId === battle.partner1UserId
          ? battle.partner1Side
          : battle.partner2Side;
      const threadId =
        agentName === battle.agent1Name
          ? battle.agent1ThreadId
          : battle.agent2ThreadId;

      if (!threadId) {
        return null;
      }

      // Get previous lyrics
      const turns = await ctx.db
        .query("turns")
        .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
        .collect();

      const previousTurn = turns
        .filter((t) => t.agentName !== agentName)
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      // Trigger with empty instructions
      await ctx.scheduler.runAfter(0, internal.rapBattle.executeRound, {
        battleId: args.battleId,
        agentName: agentName ?? "",
        threadId,
        roundNumber: battle.currentRound,
        previousLyrics: previousTurn?.lyrics ?? null,
        instructions: "",
        partnerId: args.expectedUserId,
      });
    }

    return null;
  },
});

// Execute a single round (internal action)
export const executeRound = internalAction({
  args: {
    battleId: v.id("rapBattles"),
    agentName: v.string(),
    threadId: v.string(),
    roundNumber: v.number(),
    previousLyrics: v.union(v.string(), v.null()),
    instructions: v.string(),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get battle details
    const battle = await ctx.runQuery(internal.rapBattle.getBattleInternal, {
      battleId: args.battleId,
    });

    if (!battle) {
      throw new Error("Battle not found");
    }

    // Create the rap agent
    const agent = createRapAgent(
      ctx,
      args.agentName,
      google("gemini-2.5-flash-lite-preview-09-2025")
    );

    // Build the prompt with user's instructions
    let prompt = `This is a rap battle with the theme: "${battle.theme}"\n\n`;

    if (args.instructions) {
      prompt += `Your human partner gives you these instructions: "${args.instructions}"\n\n`;
    }

    if (args.previousLyrics) {
      prompt += `Your opponent just dropped this:\n\n${args.previousLyrics}\n\nNow it's your turn. Use your partner's instructions to respond and destroy them by writing the lyrics and then calling generateMusicTool!`;
    } else {
      prompt +=
        "You're going first. Use your partner's instructions to write the opening lyrics and use generateMusicTool.";
    }

    // Save the prompt message
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      prompt,
    });

    // Generate the verse (this will trigger the generateMusicTool)
    await agent.generateText(
      ctx,
      { threadId: args.threadId },
      { promptMessageId: messageId }
    );
    // The music generation tool will handle saving the round and setting up next turn
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

/**
 * Clear pending instructions after turn is saved
 */
export const clearPendingInstructions = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.battleId, {
      pendingInstructions: undefined,
      pendingPartnerId: undefined,
    });
    return null;
  },
});

/**
 * Set up next partner's turn after music generation
 */
export const setupNextTurn = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle || battle.state === "done") {
      return null;
    }

    // Get all turns to determine whose turn is next
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect();

    const lastTurn = turns.sort((a, b) => b.createdAt - a.createdAt)[0];

    if (!lastTurn) {
      return null;
    }

    // Determine next user
    const nextUserId =
      lastTurn.partnerId === battle.partner1UserId
        ? battle.partner2UserId
        : battle.partner1UserId;

    if (!nextUserId) {
      return null;
    }

    const turnStartTime = Date.now();
    const turnDeadline = turnStartTime + TURN_DURATION_MS;

    await ctx.db.patch(args.battleId, {
      currentTurnUserId: nextUserId,
      currentTurnStartTime: turnStartTime,
      currentTurnDeadline: turnDeadline,
      updatedAt: Date.now(),
    });

    // Schedule timeout
    await ctx.scheduler.runAfter(
      TURN_DURATION_MS,
      internal.rapBattle.checkTurnTimeout,
      {
        battleId: args.battleId,
        expectedUserId: nextUserId,
        deadline: turnDeadline,
      }
    );

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

export const getBattleByThreadId = internalQuery({
  args: {
    threadId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const battles = await ctx.db.query("rapBattles").collect();
    return battles.find(
      (b) =>
        (b.agent1ThreadId === args.threadId ||
          b.agent2ThreadId === args.threadId) &&
        b.state !== "done"
    );
  },
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
 * Get waiting battles for a theme
 */
export const getWaitingBattles = query({
  args: {
    themeId: v.id("themes"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const battles = await ctx.db
      .query("rapBattles")
      .withIndex("by_theme", (q) => q.eq("themeId", args.themeId))
      .collect();

    return battles.filter((b) => b.waitingForPartner);
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
