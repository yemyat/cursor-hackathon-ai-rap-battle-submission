import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { TurnCard } from "@/components/battle/TurnCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/$battleId")({
  component: BattleView,
});

function BattleView() {
  const { battleId } = Route.useParams();
  const battle = useQuery(api.rapBattle.getBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const turns = useQuery(api.rapBattle.getTurnsByBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const [selectedRound, setSelectedRound] = useState(1);

  if (!battle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading battle...</p>
      </div>
    );
  }

  // Get turns for the selected round
  const roundTurns =
    turns?.filter((t) => t.roundNumber === selectedRound) ?? [];
  const agent1Turn = roundTurns.find((t) => t.agentName === battle.agent1Name);
  const agent2Turn = roundTurns.find((t) => t.agentName === battle.agent2Name);

  // Calculate total rounds that have at least one turn
  const maxRound = Math.max(...(turns?.map((t) => t.roundNumber) ?? [1]), 1);

  return (
    <div className="relative min-h-screen bg-zinc-950 p-6">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mx-auto mb-10 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-semibold text-4xl text-tokyo-fg tracking-tight md:text-5xl">
              {battle.theme}
            </h1>
            <p className="text-[15px] text-tokyo-comment">
              {battle.agent1Name} <span className="text-tokyo-fgDark">vs</span>{" "}
              {battle.agent2Name}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge
              className="rounded-md border-tokyo-terminal/80 bg-tokyo-terminal/60 px-3 py-1.5 font-medium text-sm text-tokyo-fgDark backdrop-blur-sm"
              variant="outline"
            >
              Round {battle.currentRound}/3
            </Badge>
            <Badge
              className={`rounded-md px-3 py-1.5 font-medium text-sm backdrop-blur-sm ${
                battle.state === "done"
                  ? "border-tokyo-green/60 bg-tokyo-green/10 text-tokyo-green"
                  : battle.state === "in_progress"
                    ? "border-tokyo-magenta/60 bg-tokyo-magenta/10 text-tokyo-magenta"
                    : "border-tokyo-cyan/60 bg-tokyo-cyan/10 text-tokyo-cyan"
              }`}
              variant="outline"
            >
              {battle.state === "done" && "Complete"}
              {battle.state === "in_progress" && "In Progress"}
              {battle.state === "preparing" && "Preparing"}
            </Badge>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            className="h-9 w-9 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedRound === 1}
            onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="rounded-lg border border-tokyo-terminal/80 bg-tokyo-bgDark/80 px-5 py-2 backdrop-blur-sm">
            <span className="font-medium text-[13px] text-tokyo-fgDark tracking-wide">
              Round {selectedRound} of {maxRound}
            </span>
          </div>
          <Button
            className="h-9 w-9 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedRound === maxRound}
            onClick={() =>
              setSelectedRound(Math.min(maxRound, selectedRound + 1))
            }
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6">
        <div className="space-y-5">
          <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-tokyo-blue shadow-[0_0_8px_rgba(122,162,247,0.6)]" />
                <CardTitle className="text-center font-semibold text-tokyo-fg text-xl tracking-tight">
                  {battle.agent1Name}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>

          {agent1Turn ? (
            <TurnCard turn={agent1Turn} />
          ) : (
            <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
              <CardContent className="py-16 text-center">
                <div className="relative inline-block">
                  <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
                  <p className="text-tokyo-comment">Waiting for verse...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-magenta/10 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-tokyo-magenta shadow-[0_0_8px_rgba(187,154,247,0.6)]" />
                <CardTitle className="text-center font-semibold text-tokyo-fg text-xl tracking-tight">
                  {battle.agent2Name}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>

          {agent2Turn ? (
            <TurnCard turn={agent2Turn} />
          ) : (
            <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-magenta/10 backdrop-blur-xl">
              <CardContent className="py-16 text-center">
                <div className="relative inline-block">
                  <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
                  <p className="text-tokyo-comment">Waiting for verse...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
