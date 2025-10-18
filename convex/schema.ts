// NOTE: You can remove this file. Declaring the shape
// of the database is entirely optional in Convex.
// See https://docs.convex.dev/database/schemas.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    // Users synced from Clerk
    users: defineTable({
      clerkUserId: v.string(),
      username: v.string(),
      createdAt: v.number(),
    }).index("by_clerk_id", ["clerkUserId"]),

    // Predefined battle themes
    themes: defineTable({
      name: v.string(),
      side1Name: v.string(),
      side2Name: v.string(),
      description: v.string(),
      order: v.number(),
    }),

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

    // Rap battles orchestration (human-guided)
    rapBattles: defineTable({
      themeId: v.id("themes"),
      theme: v.string(),
      state: v.union(
        v.literal("waiting_for_partner"),
        v.literal("preparing"),
        v.literal("in_progress"),
        v.literal("done")
      ),
      currentRound: v.number(),
      agent1Name: v.string(),
      agent2Name: v.string(),
      agent1ThreadId: v.optional(v.string()),
      agent2ThreadId: v.optional(v.string()),
      partner1UserId: v.id("users"),
      partner2UserId: v.optional(v.id("users")),
      partner1Side: v.string(),
      partner2Side: v.optional(v.string()),
      waitingForPartner: v.boolean(),
      currentTurnUserId: v.optional(v.id("users")),
      currentTurnStartTime: v.optional(v.number()),
      currentTurnDeadline: v.optional(v.number()),
      pendingInstructions: v.optional(v.string()),
      pendingPartnerId: v.optional(v.id("users")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_theme", ["themeId"])
      .index("by_waiting", ["waitingForPartner"])
      .index("by_partner1", ["partner1UserId"])
      .index("by_partner2", ["partner2UserId"]),

    // Individual turns in a rap battle
    turns: defineTable({
      rapBattleId: v.id("rapBattles"),
      roundNumber: v.number(),
      turnNumber: v.number(), // 1 or 2
      agentName: v.string(),
      partnerId: v.id("users"),
      instructions: v.string(),
      instructionSubmittedAt: v.number(),
      lyrics: v.string(),
      musicTrackId: v.id("musicTracks"),
      threadId: v.string(),
      createdAt: v.number(),
    }).index("by_battle", ["rapBattleId"]),

    // Cheerleader interactions
    cheers: defineTable({
      battleId: v.id("rapBattles"),
      userId: v.id("users"),
      cheerType: v.union(
        v.literal("applause"),
        v.literal("boo"),
        v.literal("fire")
      ),
      timestamp: v.number(),
      roundNumber: v.number(),
    }).index("by_battle_and_time", ["battleId", "timestamp"]),
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
