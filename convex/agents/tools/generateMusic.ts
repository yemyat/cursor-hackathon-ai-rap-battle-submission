"use node";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { internalAction } from "../../_generated/server";

const MUSIC_DURATION_MS = 30_000;
const MAX_ROUNDS = 6;

export const generateMusic = internalAction({
  args: {
    lyrics: v.string(),
    agentName: v.string(),
    battleId: v.optional(v.id("rapBattles")),
    threadId: v.optional(v.string()),
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

    const prompt = `Rap battle with these lyrics: ${args.lyrics}`;

    // Step 1: Create composition plan
    const compositionPlan = await elevenlabs.music.compositionPlan.create({
      prompt,
      musicLengthMs: MUSIC_DURATION_MS,
      sourceCompositionPlan: {
        positiveGlobalStyles: [
          "hiphop",
          "battle rap",
          "aggressive",
          "energetic",
          "lyrical",
        ],
        negativeGlobalStyles: ["melodic choruses", "pop", "slow", "acoustic"],
        sections: [],
      },
    });

    // Step 2: Save composition plan immediately to database
    const compositionPlanId: Id<"compositionPlans"> = await ctx.runMutation(
      internal.agents.tools.saveCompositionPlan.saveCompositionPlan,
      {
        agentName: args.agentName,
        prompt,
        compositionPlan,
        durationMs: MUSIC_DURATION_MS,
      }
    );

    // Step 3: Generate music using the composition plan
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

    // Step 4: Save music track metadata to database
    const trackId: Id<"musicTracks"> = await ctx.runMutation(
      internal.agents.tools.saveMusicTrack.saveMusicTrack,
      {
        agentName: args.agentName,
        compositionPlanId,
        storageId,
      }
    );

    // Get the storage URL
    const storageUrl = await ctx.storage.getUrl(storageId);
    if (!storageUrl) {
      throw new Error("Failed to get storage URL for uploaded music");
    }

    // If this is part of a rap battle, handle battle orchestration
    if (args.battleId && args.threadId) {
      const battle = await ctx.runQuery(internal.rapBattle.getBattleInternal, {
        battleId: args.battleId,
      });

      if (!battle) {
        throw new Error("Battle not found");
      }

      // Save this round
      await ctx.runMutation(internal.rapBattle.saveRound, {
        rapBattleId: args.battleId,
        roundNumber: battle.currentRound,
        agentName: args.agentName,
        lyrics: args.lyrics,
        musicTrackId: trackId,
        threadId: args.threadId,
      });

      // Increment the round
      await ctx.runMutation(internal.rapBattle.incrementBattleRound, {
        battleId: args.battleId,
      });

      // If we haven't reached 6 rounds yet, invoke the next agent
      if (battle.currentRound < MAX_ROUNDS) {
        // Determine which agent goes next
        const isAgent1 = args.agentName === battle.agent1Name;
        const nextAgentName = isAgent1 ? battle.agent2Name : battle.agent1Name;
        const nextThreadId = isAgent1
          ? battle.agent2ThreadId
          : battle.agent1ThreadId;

        // Schedule the next round
        await ctx.scheduler.runAfter(0, internal.rapBattle.executeRound, {
          battleId: args.battleId,
          agentName: nextAgentName,
          threadId: nextThreadId,
          roundNumber: battle.currentRound + 1,
          previousLyrics: args.lyrics,
        });
      }
    }

    return { storageUrl, trackId };
  },
});
