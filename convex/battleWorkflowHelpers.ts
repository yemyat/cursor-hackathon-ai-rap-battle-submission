import { google } from "@ai-sdk/google";
import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { createRapAgent } from "./agents/rapAgent";

/**
 * Set current turn user and timing
 */
export const setCurrentTurn = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    userId: v.id("users"),
    startTime: v.number(),
    deadline: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.battleId, {
      currentTurnUserId: args.userId,
      currentTurnStartTime: args.startTime,
      currentTurnDeadline: args.deadline,
      pendingInstructions: undefined,
      pendingPartnerId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Wait for user instructions or return empty string on timeout
 */
export const waitForInstructions = internalQuery({
  args: {
    battleId: v.id("rapBattles"),
    partnerId: v.id("users"),
    deadline: v.number(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      return null;
    }

    if (
      battle.pendingInstructions !== undefined &&
      battle.pendingPartnerId === args.partnerId
    ) {
      return battle.pendingInstructions;
    }

    if (Date.now() >= args.deadline) {
      return "";
    }

    return null;
  },
});

/**
 * Get previous opponent's lyrics for context
 */
export const getPreviousOpponentLyrics = internalQuery({
  args: {
    battleId: v.id("rapBattles"),
    agentName: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect();

    const previousTurn = turns
      .filter((t) => t.agentName !== args.agentName)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return previousTurn?.lyrics ?? null;
  },
});

/**
 * Generate lyrics using the agent (no music generation)
 */
export const generateLyrics = internalAction({
  args: {
    agentName: v.string(),
    threadId: v.string(),
    instructions: v.string(),
    previousLyrics: v.union(v.string(), v.null()),
    battleId: v.id("rapBattles"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const battle = await ctx.runQuery(internal.rapBattle.getBattleInternal, {
      battleId: args.battleId,
    });

    if (!battle) {
      throw new Error("Battle not found");
    }

    const agent = createRapAgent(
      ctx,
      args.agentName,
      google("gemini-2.5-flash-lite-preview-09-2025")
    );

    let prompt = `This is a rap battle with the theme: "${battle.theme}"\n\n`;

    if (args.instructions) {
      prompt += `Your human partner gives you these instructions: "${args.instructions}"\n\n`;
    }

    if (args.previousLyrics) {
      prompt += `Your opponent just dropped this:\n\n${args.previousLyrics}\n\nNow it's your turn. Write hard-hitting lyrics that respond and destroy them. ONLY output the lyrics, nothing else.`;
    } else {
      prompt +=
        "You're going first. Write opening lyrics that set the tone. ONLY output the lyrics, nothing else.";
    }

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      prompt,
    });

    const result = await agent.generateText(
      ctx,
      { threadId: args.threadId },
      { promptMessageId: messageId }
    );

    // Extract lyrics from the result - the agent's response is in the text
    return result.text || "";
  },
});

/**
 * Save a turn record
 */
export const saveTurn = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    roundNumber: v.number(),
    turnNumber: v.number(),
    agentName: v.string(),
    partnerId: v.id("users"),
    instructions: v.string(),
    lyrics: v.string(),
    musicTrackId: v.id("musicTracks"),
    threadId: v.string(),
  },
  returns: v.id("turns"),
  handler: async (ctx, args) => {
    const turnId = await ctx.db.insert("turns", {
      rapBattleId: args.battleId,
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
    return turnId;
  },
});

/**
 * Start synchronized playback with timing
 */
export const startSynchronizedPlayback = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    turnId: v.id("turns"),
    startedAt: v.number(),
    duration: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.battleId, {
      currentlyPlayingTurnId: args.turnId,
      playbackStartedAt: args.startedAt,
      playbackDuration: args.duration,
      playbackState: "playing",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Wait for playback to complete
 */
export const waitForPlaybackComplete = internalQuery({
  args: {
    battleId: v.id("rapBattles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      return true;
    }

    return (
      battle.playbackState === "completed" || battle.playbackState === "idle"
    );
  },
});
