import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { BattleAgentCard } from "./battle-agent-card";
import { CheerDisplay } from "./cheer-display";

type BattleLayoutProps = {
  agent1Name: string;
  agent1Turn: Doc<"turns"> | undefined;
  agent1IsPlaying: boolean;
  agent2Name: string;
  agent2Turn: Doc<"turns"> | undefined;
  agent2IsPlaying: boolean;
  battleId: Id<"rapBattles">;
  yourAgentName?: string;
};

export function BattleLayout({
  agent1Name,
  agent1Turn,
  agent1IsPlaying,
  agent2Name,
  agent2Turn,
  agent2IsPlaying,
  battleId,
  yourAgentName,
}: BattleLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-6">
          <BattleAgentCard
            agentColor="blue"
            agentName={agent1Name}
            isPlaying={agent1IsPlaying}
            isYourAgent={yourAgentName === agent1Name}
            turn={agent1Turn}
          />

          <BattleAgentCard
            agentColor="magenta"
            agentName={agent2Name}
            isPlaying={agent2IsPlaying}
            isYourAgent={yourAgentName === agent2Name}
            turn={agent2Turn}
          />
        </div>
      </div>

      {/* Cheer Display */}
      <div className="lg:col-span-1">
        <CheerDisplay battleId={battleId} />
      </div>
    </div>
  );
}
