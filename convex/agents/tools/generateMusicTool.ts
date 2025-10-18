import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";

export const generateMusicTool = createTool({
  description:
    "Generate a 30-second rap battle performance track with vocals. Use this to create complete rap tracks with vocals and beats for battling opponents.",
  args: z.object({
    prompt: z
      .string()
      .describe(
        "A detailed description of the rap performance to generate, including vocal style, delivery, and production (e.g., 'Battle rap with male vocals, aggressive delivery over dark boom-bap beat at 90 BPM, menacing and raw')"
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
        prompt: args.prompt,
        agentName,
      });

    return result;
  },
});
