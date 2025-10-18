import { google } from "@ai-sdk/google";
import { createThread, listUIMessages, saveMessage } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";
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

// Send a message to the rap battle thread and trigger agent response
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, prompt }) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.rapBattle.generateResponseAsync, {
      threadId,
      promptMessageId: messageId,
    });
    return null;
  },
});

// Generate a response to a user message using the rap agent
export const generateResponseAsync = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, promptMessageId }) => {
    // Initialize the rap agent with Anthropic's Claude Sonnet
    const agent = createRapAgent(
      ctx,
      "MC Battle Bot",
      google("gemini-2.5-flash-lite-preview-09-2025")
    );

    // Generate the rap battle response
    await agent.generateText(ctx, { threadId }, { promptMessageId });

    return null;
  },
});

// Drop a first verse with a single agent
export const dropFirstVerse = internalAction({
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

// Start a battle between two agents
export const startAgentBattle = internalAction({
  args: {
    threadId: v.string(),
    firstAgentName: v.string(),
    secondAgentName: v.string(),
    rounds: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { threadId, firstAgentName, secondAgentName, rounds = 3 }
  ) => {
    // Create two different agents
    const agent1 = createRapAgent(
      ctx,
      firstAgentName,
      google("gemini-2.5-flash-lite-preview-09-2025")
    );

    const agent2 = createRapAgent(
      ctx,
      secondAgentName,
      google("gemini-2.5-flash-lite-preview-09-2025")
    );

    // Start the battle with agent1 going first
    const { messageId: firstMessageId } = await saveMessage(
      ctx,
      components.agent,
      {
        threadId,
        prompt: "Start the battle! Drop your first verse.",
      }
    );

    // Agent 1 drops the first verse
    await agent1.generateText(
      ctx,
      { threadId },
      { promptMessageId: firstMessageId }
    );

    // Continue the battle for the specified number of rounds
    for (let i = 0; i < rounds - 1; i++) {
      // Agent 2 responds - get the most recent message
      const messagesResult = await ctx.runQuery(
        components.agent.messages.listMessagesByThreadId,
        {
          threadId,
          order: "desc",
          paginationOpts: { numItems: 1, cursor: null },
        }
      );
      const lastMessage = messagesResult.page.at(0);
      if (!lastMessage) {
        throw new Error("No messages found in thread");
      }

      await agent2.generateText(
        ctx,
        { threadId },
        { promptMessageId: lastMessage._id }
      );

      // Agent 1 counters (except on the last round)
      if (i < rounds - 2) {
        const updatedMessagesResult = await ctx.runQuery(
          components.agent.messages.listMessagesByThreadId,
          {
            threadId,
            order: "desc",
            paginationOpts: { numItems: 1, cursor: null },
          }
        );
        const lastMessage2 = updatedMessagesResult.page.at(0);
        if (!lastMessage2) {
          throw new Error("No messages found in thread");
        }
        await agent1.generateText(
          ctx,
          { threadId },
          { promptMessageId: lastMessage2._id }
        );
      }
    }

    const messagesResult = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId,
        order: "desc",
        paginationOpts: { numItems: 50, cursor: null },
      }
    );

    return messagesResult;
  },
});
