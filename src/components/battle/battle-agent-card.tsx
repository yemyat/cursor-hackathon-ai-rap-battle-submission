import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Doc } from "../../../convex/_generated/dataModel";
import { TurnCard } from "./turn-card";

type BattleAgentCardProps = {
  agentName: string;
  agentColor: "blue" | "magenta";
  turn: Doc<"turns"> | undefined;
  isPlaying: boolean;
};

export function BattleAgentCard({
  agentName,
  agentColor,
  turn,
  isPlaying,
}: BattleAgentCardProps) {
  const colorClasses = {
    blue: {
      card: "ring-tokyo-blue/10",
      dot: "bg-tokyo-blue shadow-[0_0_8px_rgba(122,162,247,0.6)]",
    },
    magenta: {
      card: "ring-tokyo-magenta/10",
      dot: "bg-tokyo-magenta shadow-[0_0_8px_rgba(187,154,247,0.6)]",
    },
  };

  return (
    <div className="space-y-5">
      <Card
        className={`mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ${colorClasses[agentColor].card} backdrop-blur-xl`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${colorClasses[agentColor].dot}`}
            />
            <CardTitle className="text-center font-semibold text-tokyo-fg text-xl tracking-tight">
              {agentName}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      {turn ? (
        <TurnCard agentColor={agentColor} isPlaying={isPlaying} turn={turn} />
      ) : (
        <Card
          className={`mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ${colorClasses[agentColor].card} backdrop-blur-xl`}
        >
          <CardContent className="py-16 text-center">
            <div className="relative inline-block">
              <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
              <p className="text-tokyo-comment">Waiting for verse...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
