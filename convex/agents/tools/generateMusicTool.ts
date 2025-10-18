import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

export const generateMusicTool = createTool({
  description:
    "Generate a 30-second rap battle performance track with vocals. Use this to create complete rap tracks with vocals and beats for battling opponents.",
  args: z.object({
    lyrics: z
      .string()
      .describe(
        "The lyrics for the rap battle performance to generate. Make it epic."
      ),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ storageUrl: string; trackId: Id<"musicTracks"> }> => {
    // Get agent name, fallback to "Unknown Agent" if not available
    const agentName = ctx.agent?.options?.name ?? "Unknown Agent";

    // Delegate to internal action
    const result: { storageUrl: string; trackId: Id<"musicTracks"> } =
      await ctx.runAction(internal.agents.tools.generateMusic.generateMusic, {
        lyrics: args.lyrics,
        agentName,
      });

    return result;
  },
});
