import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { MUSIC_DURATION_MS, TURN_DURATION_MS } from "../constants";

export const workflow = new WorkflowManager(components.workflow);

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
    console.log("🎤 Starting battle workflow", { battleId: args.battleId });

    // Get battle details
    const battle = await step.runQuery(internal.rapBattle.getBattleInternal, {
      battleId: args.battleId,
    });

    if (!battle) {
      throw new Error("Battle not found");
    }

    console.log("✅ Battle loaded", {
      agent1: battle.agent1Name,
      agent2: battle.agent2Name,
    });

    // Determine which partner controls which agent
    const partner1ControlsAgent1 = battle.partner1Side === battle.agent1Name;

    console.log("🎮 Partner assignments:", {
      partner1Side: battle.partner1Side,
      partner2Side: battle.partner2Side,
      agent1Name: battle.agent1Name,
      agent2Name: battle.agent2Name,
      partner1ControlsAgent1,
    });

    // Run 3 rounds
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      console.log(`🔄 Starting round ${round}/${MAX_ROUNDS}`);
      // Agent 1's turn (use correct partner and thread)
      await executeTurn(step, {
        battleId: args.battleId,
        roundNumber: round,
        agentName: battle.agent1Name,
        threadId: args.agent1ThreadId,
        partnerId: partner1ControlsAgent1
          ? args.partner1UserId
          : args.partner2UserId,
      });

      // Agent 2's turn (use correct partner and thread)
      await executeTurn(step, {
        battleId: args.battleId,
        roundNumber: round,
        agentName: battle.agent2Name,
        threadId: args.agent2ThreadId,
        partnerId: partner1ControlsAgent1
          ? args.partner2UserId
          : args.partner1UserId,
      });

      // Increment round after both turns complete
      if (round < MAX_ROUNDS) {
        console.log(`✅ Round ${round} complete, incrementing`);
        await step.runMutation(internal.rapBattle.incrementBattleRound, {
          battleId: args.battleId,
        });
      }
    }

    console.log("🏁 Battle complete!");
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
  const { battleId, roundNumber, agentName, threadId, partnerId } = params;

  console.log(`🎵 Turn started: ${agentName} (Round ${roundNumber})`);

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

  console.log(`⏱️  Waiting for instructions (${TURN_DURATION_MS}ms)...`);

  // Poll for instructions every 500ms until submitted or timeout
  const POLL_INTERVAL_MS = 500;
  let instructions: string | null = null;
  let elapsed = 0;

  while (elapsed < TURN_DURATION_MS && instructions === null) {
    instructions = await step.runQuery(
      internal.battleWorkflowHelpers.waitForInstructions,
      {
        battleId,
        partnerId,
        deadline,
      },
      { runAfter: POLL_INTERVAL_MS }
    );
    elapsed += POLL_INTERVAL_MS;
  }

  console.log(
    `📝 Instructions received: ${instructions ? `"${instructions}"` : "timeout"}`
  );

  // Clear the turn state immediately after instructions received/timeout
  await step.runMutation(internal.battleWorkflowHelpers.clearCurrentTurn, {
    battleId,
  });

  // 2. Get previous opponent's lyrics for context
  const previousLyrics = await step.runQuery(
    internal.battleWorkflowHelpers.getPreviousOpponentLyrics,
    {
      battleId,
      agentName,
    }
  );

  console.log(`🔍 Previous lyrics: ${previousLyrics ? "found" : "none"}`);

  // 3. Generate lyrics using the agent
  console.log(`✍️  Generating lyrics for ${agentName}...`);
  const lyrics = await step.runAction(
    internal.battleWorkflowHelpers.generateLyrics,
    {
      agentName,
      threadId,
      instructions: instructions || "",
      previousLyrics,
      battleId,
    }
  );

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

  console.log(`✅ Lyrics generated (${lyrics.length} chars)`);

  // 8. Save turn record
  const battleData = await step.runQuery(internal.rapBattle.getBattleInternal, {
    battleId,
  });
  const turnNumber = agentName === battleData.agent1Name ? 1 : 2;

  console.log(`💾 Saving turn ${turnNumber}...`);

  const turnId = await step.runMutation(
    internal.battleWorkflowHelpers.saveTurn,
    {
      battleId,
      roundNumber,
      turnNumber,
      agentName,
      partnerId,
      instructions: instructions || "",
      lyrics,
      musicTrackId: trackId,
      threadId,
    }
  );

  console.log(`✅ Turn saved (${turnId})`);

  // 6. Start synchronized playback
  const serverTime = Date.now();
  const duration = MUSIC_DURATION_MS;

  console.log(`▶️  Starting playback (${duration}ms)...`);

  await step.runMutation(
    internal.battleWorkflowHelpers.startSynchronizedPlayback,
    {
      battleId,
      turnId,
      startedAt: serverTime,
      duration,
    }
  );

  // 10. Wait for playback to complete
  await step.runQuery(
    internal.battleWorkflowHelpers.waitForPlaybackComplete,
    { battleId },
    { runAfter: duration + PLAYBACK_BUFFER_MS }
  );

  console.log(`✅ Playback complete for ${agentName}`);
}
