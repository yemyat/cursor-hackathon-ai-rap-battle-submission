import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

export const saveMusicTrack = internalMutation({
  args: {
    agentName: v.string(),
    prompt: v.string(),
    compositionPlan: v.any(),
    storageId: v.id("_storage"),
    durationMs: v.number(),
  },
  returns: v.id("musicTracks"),
  handler: async (ctx, args) => {
    const trackId = await ctx.db.insert("musicTracks", {
      agentName: args.agentName,
      prompt: args.prompt,
      compositionPlan: args.compositionPlan,
      storageId: args.storageId,
      durationMs: args.durationMs,
      createdAt: Date.now(),
    });

    return trackId;
  },
});
