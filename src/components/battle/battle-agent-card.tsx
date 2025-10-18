import { Card, CardContent } from "@/components/ui/card";
import type { Doc } from "../../../convex/_generated/dataModel";
import { TurnCard } from "./turn-card";

type BattleAgentCardProps = {
  agentName: string;
  agentColor: "blue" | "magenta";
  turn: Doc<"turns"> | undefined;
  isPlaying: boolean;
  isYourAgent: boolean;
};

export function BattleAgentCard({
  agentName,
  agentColor,
  turn,
  isPlaying,
  isYourAgent,
}: BattleAgentCardProps) {
  return (
    <div>
      {turn ? (
        <TurnCard
          agentColor={agentColor}
          agentName={agentName}
          isPlaying={isPlaying}
          isYourAgent={isYourAgent}
          turn={turn}
        />
      ) : (
        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="py-16 text-center">
            <p className="mb-2 font-bold text-brand-coral text-xl">
              {agentName}
              {isYourAgent && (
                <span className="ml-2 text-base text-white/70">(You)</span>
              )}
            </p>
            <p className="text-lg text-white/60">Waiting for verse...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
