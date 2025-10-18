import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const workflow = new WorkflowManager(components.workflow);

const TURN_DURATION_MS = 10_000; // 10 seconds for instructions
const MAX_ROUNDS = 3;
const PLAYBACK_BUFFER_MS = 500;

/**
 * Main battle workflow that orchestrates the entire rap battle.
 * 
 * This workflow handles:
 * - Turn timing and timeouts
 * - Agent lyrics generation
 * - Music composition and generation
 * - Synchronized playback timing
 * - Round progression
 * - Battle completion
 */
export const battleWorkflow = workflow.define({
  args: {
    battleId: v.id("rapBattles"),
    agent1ThreadId: v.string(),
    agent2ThreadId: v.string(),
    partner1UserId: v.id("users"),
    partner2UserId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    // Get battle details
    const battle = await step.runQuery(internal.rapBattle.getBattleInternal, {
      battleId: args.battleId,
    });

    if (!battle) {
      throw new Error("Battle not found");
    }

    // Run 3 rounds
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      // Agent 1's turn
      await executeTurn(step, {
        battleId: args.battleId,
        roundNumber: round,
        agentName: battle.agent1Name,
        threadId: args.agent1ThreadId,
        partnerId: args.partner1UserId,
      });

      // Agent 2's turn
      await executeTurn(step, {
        battleId: args.battleId,
        roundNumber: round,
        agentName: battle.agent2Name,
        threadId: args.agent2ThreadId,
        partnerId: args.partner2UserId,
      });

      // Increment round after both turns complete
      if (round < MAX_ROUNDS) {
        await step.runMutation(internal.rapBattle.incrementBattleRound, {
          battleId: args.battleId,
        });
      }
    }

    // Mark battle as done
    await step.runMutation(internal.rapBattle.updateBattleState, {
      battleId: args.battleId,
      state: "done",
    });
  },
});

/**
 * Execute a single turn in the battle
 */
async function executeTurn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any,
  params: {
    battleId: Id<"rapBattles">;
    roundNumber: number;
    agentName: string;
    threadId: string;
    partnerId: Id<"users">;
  }
): Promise<void> {
  const {
    battleId,
    roundNumber,
    agentName,
    threadId,
    partnerId,
  } = params;

  // 1. Wait for user instructions (with timeout)
  const turnStartTime = Date.now();
  const deadline = turnStartTime + TURN_DURATION_MS;

  // Set current turn user and start timer
  await step.runMutation(internal.battleWorkflowHelpers.setCurrentTurn, {
    battleId,
    userId: partnerId,
    startTime: turnStartTime,
    deadline,
  });

  // Wait for instructions or timeout
  const instructions = await step.runQuery(
    internal.battleWorkflowHelpers.waitForInstructions,
    {
      battleId,
      partnerId,
      deadline,
    },
    { runAfter: TURN_DURATION_MS }
  );

  // 2. Get previous opponent's lyrics for context
  const previousLyrics = await step.runQuery(
    internal.battleWorkflowHelpers.getPreviousOpponentLyrics,
    {
      battleId,
      agentName,
    }
  );

  // 3. Generate lyrics using the agent
  const lyrics = await step.runAction(internal.battleWorkflowHelpers.generateLyrics, {
    agentName,
    threadId,
    instructions: instructions || "",
    previousLyrics,
    battleId,
  });

  // 4. Generate composition plan (this saves it internally)
  const { compositionPlan, compositionPlanId } = await step.runAction(
    internal.agents.tools.generateMusic.generateCompositionPlan,
    {
      agentName,
      lyrics,
    }
  );

  // 5. Generate music from plan (this saves the track internally)
  const { trackId } = await step.runAction(
    internal.agents.tools.generateMusic.composeMusicFromPlan,
    {
      compositionPlan,
      compositionPlanId,
      agentName,
    }
  );

  // 8. Save turn record
  const battleData = await step.runQuery(
    internal.rapBattle.getBattleInternal,
    { battleId }
  );
  const turnNumber = agentName === battleData.agent1Name ? 1 : 2;

  const turnId = await step.runMutation(internal.battleWorkflowHelpers.saveTurn, {
    battleId,
    roundNumber,
    turnNumber,
    agentName,
    partnerId,
    instructions: instructions || "",
    lyrics,
    musicTrackId: trackId,
    threadId,
  });

  // 6. Start synchronized playback
  const serverTime = Date.now();
  const duration = (compositionPlan.compositionPlan.sections as Array<{ durationMs: number }>).reduce(
    (sum: number, section: { durationMs: number }) => sum + section.durationMs,
    0
  );

  await step.runMutation(internal.battleWorkflowHelpers.startSynchronizedPlayback, {
    battleId,
    turnId,
    startedAt: serverTime,
    duration,
  });

  // 10. Wait for playback to complete
  await step.runQuery(
    internal.battleWorkflowHelpers.waitForPlaybackComplete,
    { battleId },
    { runAfter: duration + PLAYBACK_BUFFER_MS }
  );
}
