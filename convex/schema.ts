// NOTE: You can remove this file. Declaring the shape
// of the database is entirely optional in Convex.
// See https://docs.convex.dev/database/schemas.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    // Composition plans generated before music composition
    compositionPlans: defineTable({
      agentName: v.string(),
      prompt: v.string(),
      // Raw composition plan from ElevenLabs
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
      // Extracted lyrics from all sections
      lyrics: v.string(),
      durationMs: v.number(),
      createdAt: v.number(),
    }),
    // Tracks generated music for rap battle agents
    musicTracks: defineTable({
      agentName: v.string(),
      compositionPlanId: v.id("compositionPlans"),
      storageId: v.id("_storage"),
      createdAt: v.number(),
    }),
    // Rap battles orchestration
    rapBattles: defineTable({
      theme: v.string(),
      state: v.union(
        v.literal("preparing"),
        v.literal("in_progress"),
        v.literal("done")
      ),
      currentRound: v.number(),
      agent1Name: v.string(),
      agent2Name: v.string(),
      agent1ThreadId: v.string(),
      agent2ThreadId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    // Individual rounds in a rap battle
    rounds: defineTable({
      rapBattleId: v.id("rapBattles"),
      roundNumber: v.number(),
      agentName: v.string(),
      lyrics: v.string(),
      musicTrackId: v.id("musicTracks"),
      threadId: v.string(),
      createdAt: v.number(),
    }).index("by_battle", ["rapBattleId"]),
  },
  // If you ever get an error about schema mismatch
  // between your data and your schema, and you cannot
  // change the schema to match the current data in your database,
  // you can:
  //  1. Use the dashboard to delete tables or individual documents
  //     that are causing the error.
  //  2. Change this option to `false` and make changes to the data
  //     freely, ignoring the schema. Don't forget to change back to `true`!
  { schemaValidation: true }
);
