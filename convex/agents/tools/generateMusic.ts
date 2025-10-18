"use node";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { internalAction } from "../../_generated/server";

const MUSIC_DURATION_MS = 30_000;

/**
 * Creates a composition plan using ElevenLabs API and saves it to the database.
 * Returns the composition plan object and its database ID.
 */
export const generateCompositionPlan = internalAction({
  args: {
    lyrics: v.string(),
    agentName: v.string(),
  },
  returns: v.object({
    compositionPlan: v.any(),
    compositionPlanId: v.id("compositionPlans"),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ELEVENLABS_API_KEY environment variable is not set. Please add it in the Convex dashboard under Settings > Environment Variables."
      );
    }

    const elevenlabs = new ElevenLabsClient({ apiKey });
    const prompt = `Rap battle with these lyrics: ${args.lyrics}`;

    // Create composition plan with ElevenLabs
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

    // Save composition plan to database
    const compositionPlanId: Id<"compositionPlans"> = await ctx.runMutation(
      internal.agents.tools.saveCompositionPlan.saveCompositionPlan,
      {
        agentName: args.agentName,
        prompt,
        compositionPlan,
        durationMs: MUSIC_DURATION_MS,
      }
    );

    return { compositionPlan, compositionPlanId, prompt };
  },
});

/**
 * Composes music from a composition plan using ElevenLabs API.
 * Uses composeDetailed to get metadata along with the audio.
 * Converts the audio stream to a blob, stores it, and saves track metadata.
 */
export const composeMusicFromPlan = internalAction({
  args: {
    compositionPlan: v.any(),
    compositionPlanId: v.id("compositionPlans"),
    agentName: v.string(),
  },
  returns: v.object({
    storageUrl: v.string(),
    trackId: v.id("musicTracks"),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ELEVENLABS_API_KEY environment variable is not set. Please add it in the Convex dashboard under Settings > Environment Variables."
      );
    }

    const elevenlabs = new ElevenLabsClient({ apiKey });

    // Generate music using the composition plan with detailed response
    // The SDK wrapper already parses the multipart response for us
    const detailedResponse = await elevenlabs.music.composeDetailed({
      compositionPlan: args.compositionPlan,
    });

    // The response contains:
    // - json.compositionPlan: { positiveGlobalStyles, negativeGlobalStyles, sections }
    // - json.songMetadata: { title, description, genres, languages, is_explicit }
    // - audio: Buffer (ready to use)
    // - filename: string

    // You can access metadata like this:
    // const { compositionPlan, songMetadata } = detailedResponse.json;

    // Create audio blob from the Buffer (convert to Uint8Array for compatibility)
    const audioData = new Uint8Array(detailedResponse.audio);
    const audioBlob = new Blob([audioData], { type: "audio/mpeg" });

    // Upload to Convex storage
    const storageId = await ctx.storage.store(audioBlob);

    // Save music track metadata to database
    const trackId: Id<"musicTracks"> = await ctx.runMutation(
      internal.agents.tools.saveMusicTrack.saveMusicTrack,
      {
        agentName: args.agentName,
        compositionPlanId: args.compositionPlanId,
        storageId,
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
  ): Promise<{
    storageUrl: string;
    trackId: Id<"musicTracks">;
  }> => {
    // Step 1: Create composition plan
    const { compositionPlan, compositionPlanId } = await ctx.runAction(
      internal.agents.tools.generateMusic.generateCompositionPlan,
      {
        lyrics: args.lyrics,
        agentName: args.agentName,
      }
    );

    // Step 2: Compose music from the plan
    const { storageUrl, trackId } = await ctx.runAction(
      internal.agents.tools.generateMusic.composeMusicFromPlan,
      {
        compositionPlan,
        compositionPlanId,
        agentName: args.agentName,
      }
    );

    // Get the storage URL (already have it from composeMusicFromPlan)
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

      // Get all turns to determine turn number and partner
      const turns = await ctx.runQuery(internal.rapBattle.getTurnsInternal, {
        battleId: args.battleId,
      });

      const currentRoundTurns = turns.filter(
        (t: { roundNumber: number }) => t.roundNumber === battle.currentRound
      );

      const turnNumber = currentRoundTurns.length + 1;

      // Get pending instructions and partner from battle document
      const instructions = battle.pendingInstructions ?? "";
      const partnerId = battle.pendingPartnerId;

      if (!partnerId) {
        throw new Error("No pending partner ID found for this turn");
      }

      // Save this turn
      await ctx.runMutation(internal.rapBattle.saveTurn, {
        rapBattleId: args.battleId,
        roundNumber: battle.currentRound,
        turnNumber,
        agentName: args.agentName,
        partnerId,
        instructions,
        lyrics: args.lyrics,
        musicTrackId: trackId,
        threadId: args.threadId,
      });

      // Increment the round (will check if 2 turns are complete)
      await ctx.runMutation(internal.rapBattle.incrementBattleRound, {
        battleId: args.battleId,
      });

      // Check if battle is done
      const updatedBattle = await ctx.runQuery(
        internal.rapBattle.getBattleInternal,
        {
          battleId: args.battleId,
        }
      );

      if (!updatedBattle || updatedBattle.state === "done") {
        return { storageUrl, trackId };
      }

      // Clear pending instructions
      await ctx.runMutation(internal.rapBattle.clearPendingInstructions, {
        battleId: args.battleId,
      });

      // Set up next partner's turn (they have 10 seconds to submit instructions)
      await ctx.runMutation(internal.rapBattle.setupNextTurn, {
        battleId: args.battleId,
      });
    }

    return { storageUrl, trackId };
  },
});
