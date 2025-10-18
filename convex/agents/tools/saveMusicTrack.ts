import { v } from "convex/values";
import type { Id } from "../../_generated/dataModel";
import { internalMutation } from "../../_generated/server";

export const saveMusicTrack = internalMutation({
  args: {
    agentName: v.string(),
    compositionPlanId: v.id("compositionPlans"),
    storageId: v.id("_storage"),
  },
  returns: v.id("musicTracks"),
  handler: async (ctx, args) => {
    const trackId: Id<"musicTracks"> = await ctx.db.insert("musicTracks", {
      agentName: args.agentName,
      compositionPlanId: args.compositionPlanId,
      storageId: args.storageId,
      createdAt: Date.now(),
    });

    return trackId;
  },
});
