"use node";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { internalAction } from "../../_generated/server";

const MUSIC_DURATION_MS = 30_000;

export const generateMusic = internalAction({
  args: {
    prompt: v.string(),
    agentName: v.string(),
  },
  returns: v.object({
    storageUrl: v.string(),
    trackId: v.id("musicTracks"),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ storageUrl: string; trackId: Id<"musicTracks"> }> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ELEVENLABS_API_KEY environment variable is not set. Please add it in the Convex dashboard under Settings > Environment Variables."
      );
    }

    // Initialize ElevenLabs client
    const elevenlabs = new ElevenLabsClient({ apiKey });

    // Step 1: Create composition plan
    const compositionPlan = await elevenlabs.music.compositionPlan.create({
      prompt: `${args.prompt}. Include styles: hiphop, battle rap, aggressive, energetic, lyrical. Exclude styles: melodic choruses, pop, slow, acoustic.`,
      musicLengthMs: MUSIC_DURATION_MS,
    });

    // Step 2: Generate music using the composition plan
    const track = await elevenlabs.music.compose({
      compositionPlan,
    });

    // Convert the ReadableStream to a Blob
    // The track is a ReadableStream that needs to be converted to bytes
    const reader = track.getReader();
    const chunks: Uint8Array[] = [];
    let result = await reader.read();

    while (!result.done) {
      chunks.push(result.value);
      result = await reader.read();
    }

    // Combine all chunks into a single Blob
    const audioBlob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });

    // Upload to Convex storage
    const storageId = await ctx.storage.store(audioBlob);

    // Save metadata to database
    const trackId: Id<"musicTracks"> = await ctx.runMutation(
      internal.agents.tools.saveMusicTrack.saveMusicTrack,
      {
        agentName: args.agentName,
        prompt: args.prompt,
        compositionPlan,
        storageId,
        durationMs: MUSIC_DURATION_MS,
      }
    );

    // Get the storage URL
    const storageUrl = await ctx.storage.getUrl(storageId);
    if (!storageUrl) {
      throw new Error("Failed to get storage URL for uploaded music");
    }

    return { storageUrl, trackId };
  },
});
