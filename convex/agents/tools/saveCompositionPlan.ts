import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { internalMutation } from "../../_generated/server";

export const saveCompositionPlan = internalMutation({
  args: {
    agentName: v.string(),
    prompt: v.string(),
    compositionPlan: v.object({
      positiveGlobalStyles: v.array(v.string()),
      negativeGlobalStyles: v.array(v.string()),
      sections: v.array(
        v.object({
          sectionName: v.string(),
          durationMs: v.number(),
          lines: v.array(v.string()),
          positiveLocalStyles: v.array(v.string()),
          negativeLocalStyles: v.array(v.string()),
        })
      ),
    }),
    durationMs: v.number(),
  },
  returns: v.id("compositionPlans"),
  handler: async (ctx, args) => {
    // Extract lyrics from all sections
    const lyrics = args.compositionPlan.sections
      .flatMap((section) => section.lines)
      .join("\n");

    const compositionPlanId: Id<"compositionPlans"> = await ctx.db.insert(
      "compositionPlans",
      {
        agentName: args.agentName,
        prompt: args.prompt,
        compositionPlan: args.compositionPlan,
        lyrics,
        durationMs: args.durationMs,
        createdAt: Date.now(),
      }
    );

    return compositionPlanId;
  },
});
