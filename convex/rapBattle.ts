import { google } from "@ai-sdk/google";
import { createThread, listUIMessages, saveMessage } from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
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
