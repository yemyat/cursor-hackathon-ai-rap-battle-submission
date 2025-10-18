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

// Start a new rap battle
export const startRapBattle = mutation({
  args: {
    theme: v.string(),
    agent1Name: v.string(),
    agent2Name: v.string(),
  },
  returns: v.id("rapBattles"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create threads for both agents
    const agent1ThreadId = await createThread(ctx, components.agent, {
      title: `${args.agent1Name} - ${args.theme}`,
    });

    const agent2ThreadId = await createThread(ctx, components.agent, {
      title: `${args.agent2Name} - ${args.theme}`,
    });

    // Create the battle record
    const battleId = await ctx.db.insert("rapBattles", {
      theme: args.theme,
      state: "preparing",
      currentRound: 0,
      agent1Name: args.agent1Name,
      agent2Name: args.agent2Name,
      agent1ThreadId,
      agent2ThreadId,
      createdAt: now,
      updatedAt: now,
    });

    // Kick off the first round with agent1
    await ctx.scheduler.runAfter(0, internal.rapBattle.executeRound, {
      battleId,
      agentName: args.agent1Name,
      threadId: agent1ThreadId,
      roundNumber: 1,
      previousLyrics: null,
    });

    return battleId;
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
  },
  handler: async (ctx, args) => {
    // Update battle state to in_progress if it's the first round
    if (args.roundNumber === 1) {
      await ctx.runMutation(internal.rapBattle.updateBattleState, {
        battleId: args.battleId,
        state: "in_progress",
      });
    }

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

    // Build the prompt
    let prompt = `This is a rap battle with the theme: "${battle.theme}"\n\n`;
    if (args.previousLyrics) {
      prompt += `Your opponent just dropped this:\n\n${args.previousLyrics}\n\nNow it's your turn. Respond and destroy them!`;
    } else {
      prompt += "You're going first. Drop your opening verse and set the tone!";
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

    // The music generation tool will handle saving the round and chaining to the next agent
  },
});

// Internal mutations for battle management
export const updateBattleState = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    state: v.union(
      v.literal("preparing"),
      v.literal("in_progress"),
      v.literal("done")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.battleId, {
      state: args.state,
      updatedAt: Date.now(),
    });
  },
});

const MAX_ROUNDS = 6;

export const incrementBattleRound = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
  },
  handler: async (ctx, args) => {
    const battle = await ctx.db.get(args.battleId);
    if (!battle) {
      throw new Error("Battle not found");
    }

    const newRound = battle.currentRound + 1;
    await ctx.db.patch(args.battleId, {
      currentRound: newRound,
      updatedAt: Date.now(),
    });

    // Mark as done if we've completed 6 rounds
    if (newRound > MAX_ROUNDS) {
      await ctx.db.patch(args.battleId, {
        state: "done",
        updatedAt: Date.now(),
      });
    }
  },
});

export const saveRound = internalMutation({
  args: {
    rapBattleId: v.id("rapBattles"),
    roundNumber: v.number(),
    agentName: v.string(),
    lyrics: v.string(),
    musicTrackId: v.id("musicTracks"),
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("rounds", {
      rapBattleId: args.rapBattleId,
      roundNumber: args.roundNumber,
      agentName: args.agentName,
      lyrics: args.lyrics,
      musicTrackId: args.musicTrackId,
      threadId: args.threadId,
      createdAt: Date.now(),
    });
  },
});

export const getBattle = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  handler: async (ctx, args) => ctx.db.get(args.battleId),
});

export const getBattleInternal = internalQuery({
  args: {
    battleId: v.id("rapBattles"),
  },
  handler: async (ctx, args) => ctx.db.get(args.battleId),
});

export const getBattleByThreadId = internalQuery({
  args: {
    threadId: v.string(),
  },
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

export const getRoundsByBattle = query({
  args: {
    battleId: v.id("rapBattles"),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("rounds")
      .withIndex("by_battle", (q) => q.eq("rapBattleId", args.battleId))
      .collect(),
});

export const getMusicTrack = query({
  args: {
    trackId: v.id("musicTracks"),
  },
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
