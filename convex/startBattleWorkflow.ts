import type { WorkflowId } from "@convex-dev/workflow";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { workflow } from "./workflows/battleWorkflow";

/**
 * Start the battle workflow
 */
export const start = internalMutation({
  args: {
    battleId: v.id("rapBattles"),
    agent1ThreadId: v.string(),
    agent2ThreadId: v.string(),
    partner1UserId: v.id("users"),
    partner2UserId: v.id("users"),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<WorkflowId> => {
    // Start workflow and return the ID
    return await workflow.start(
      ctx,
      internal.workflows.battleWorkflow.battleWorkflow,
      {
        battleId: args.battleId,
        agent1ThreadId: args.agent1ThreadId,
        agent2ThreadId: args.agent2ThreadId,
        partner1UserId: args.partner1UserId,
        partner2UserId: args.partner2UserId,
      }
    );
  },
});
