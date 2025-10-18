import type { Doc } from "../../../convex/_generated/dataModel";
import { BattleHeader } from "./battle-header";
import { BattleLayout } from "./battle-layout";
import { BattleStatus } from "./battle-status";
import { InstructionInput } from "./instruction-input";

type BattleMainContentProps = {
  battle: Doc<"rapBattles">;
  currentUser: Doc<"users"> | null | undefined;
  agent1Turn: Doc<"turns"> | undefined;
  agent2Turn: Doc<"turns"> | undefined;
  agent1IsPlaying: boolean;
  agent2IsPlaying: boolean;
  isRappingPartner: boolean;
  isYourTurn: boolean;
  yourAgentName?: string;
  currentTurn: Doc<"turns"> | null;
  isReplayMode?: boolean;
};

export function BattleMainContent({
  battle,
  currentUser,
  agent1Turn,
  agent2Turn,
  agent1IsPlaying,
  agent2IsPlaying,
  isRappingPartner,
  isYourTurn,
  yourAgentName,
  currentTurn,
  isReplayMode = false,
}: BattleMainContentProps) {
  return (
    <div className="mb-10">
      <BattleHeader
        agent1Name={battle.agent1Name}
        agent2Name={battle.agent2Name}
        battleState={battle.state}
        currentRound={battle.currentRound}
        isRappingPartner={isRappingPartner}
        maxRounds={3}
        theme={battle.theme}
        yourAgentName={yourAgentName}
      />

      {/* Battle Status Indicator */}
      <div className="mb-6">
        {isReplayMode ? (
          <div className="rounded-lg border border-brand-coral/50 bg-brand-coral/10 p-4 text-center backdrop-blur-xl">
            <p className="font-bold text-brand-coral text-xl">🎬 Replay Mode</p>
            <p className="mt-2 text-sm text-white/70">
              Navigate rounds and play tracks freely
            </p>
          </div>
        ) : (
          <BattleStatus
            agent1Name={battle.agent1Name}
            agent2Name={battle.agent2Name}
            battleState={battle.state}
            currentlyPlayingAgentName={currentTurn?.agentName}
            currentRound={battle.currentRound}
            currentTurnUserId={battle.currentTurnUserId}
            currentUserId={currentUser?._id}
            partner1UserId={battle.partner1UserId}
            playbackState={battle.playbackState}
          />
        )}
      </div>

      {/* Instruction Input (only visible to rapping partners in active battles) */}
      {!isReplayMode && isRappingPartner && battle.state === "in_progress" && (
        <div className="mb-6">
          <InstructionInput
            agentName={yourAgentName ?? ""}
            battleId={battle._id}
            isYourTurn={isYourTurn}
          />
        </div>
      )}

      <BattleLayout
        agent1IsPlaying={agent1IsPlaying}
        agent1Name={battle.agent1Name}
        agent1Turn={agent1Turn}
        agent2IsPlaying={agent2IsPlaying}
        agent2Name={battle.agent2Name}
        agent2Turn={agent2Turn}
        battleId={battle._id}
        isReplayMode={isReplayMode}
        yourAgentName={yourAgentName}
      />
    </div>
  );
}
