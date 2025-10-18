import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <div className="relative min-h-screen animate-fade-up bg-zinc-950 p-6">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mx-auto mb-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-semibold text-4xl text-zinc-50 tracking-tight md:text-5xl">
              {battle.theme}
            </h1>
            <p className="text-[15px] text-zinc-400">
              {battle.agent1Name} vs {battle.agent2Name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className="rounded-full border-zinc-700/60 bg-zinc-900/70 px-3 py-1.5 font-medium text-sm text-zinc-300"
              variant="outline"
            >
              Round {battle.currentRound}/3
            </Badge>
            <Badge
              className={`rounded-full px-3 py-1.5 font-medium text-sm ${
                battle.state === "done"
                  ? "border-brand-mint/50 bg-brand-mint/10 text-brand-mint"
                  : battle.state === "in_progress"
                    ? "border-brand-purple/50 bg-brand-purple/10 text-brand-purple"
                    : "border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan"
              }`}
              variant="outline"
            >
              {battle.state === "done" && "Complete"}
              {battle.state === "in_progress" && "In Progress"}
              {battle.state === "preparing" && "Preparing"}
            </Badge>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            className="hover:glow-accent h-10 w-10 rounded-full border-zinc-700/60 bg-zinc-900/70 transition-all duration-300 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedRound === 1}
            onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="rounded-full border border-zinc-800/60 bg-zinc-950/60 px-6 py-2.5 backdrop-blur-sm">
            <span className="font-medium text-sm text-zinc-300">
              Round {selectedRound} of {maxRound}
            </span>
          </div>
          <Button
            className="hover:glow-accent h-10 w-10 rounded-full border-zinc-700/60 bg-zinc-900/70 transition-all duration-300 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedRound === maxRound}
            onClick={() =>
              setSelectedRound(Math.min(maxRound, selectedRound + 1))
            }
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center font-semibold text-2xl text-zinc-50 tracking-tight">
                {battle.agent1Name}
              </CardTitle>
            </CardHeader>
          </Card>

          {agent1Turn ? (
            <TurnCard turn={agent1Turn} />
          ) : (
            <Card className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm">
              <CardContent className="py-20 text-center">
                <div className="relative inline-block">
                  <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
                  <p className="text-zinc-500">Waiting for verse...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center font-semibold text-2xl text-zinc-50 tracking-tight">
                {battle.agent2Name}
              </CardTitle>
            </CardHeader>
          </Card>

          {agent2Turn ? (
            <TurnCard turn={agent2Turn} />
          ) : (
            <Card className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm">
              <CardContent className="py-20 text-center">
                <div className="relative inline-block">
                  <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
                  <p className="text-zinc-500">Waiting for verse...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

type Turn = {
  _id: Id<"turns">;
  roundNumber: number;
  turnNumber: number;
  agentName: string;
  lyrics: string;
  musicTrackId: Id<"musicTracks">;
  threadId: string;
};

function TurnCard({ turn }: { turn: Turn }) {
  const musicTrack = useQuery(api.rapBattle.getMusicTrack, {
    trackId: turn.musicTrackId,
  });

  return (
    <Card className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge
            className="rounded-full border-zinc-700/60 bg-zinc-900/70 px-2.5 py-1 font-medium text-[12px] text-zinc-300"
            variant="outline"
          >
            Turn {turn.turnNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <div>
          <h4 className="mb-3 font-medium text-xs text-zinc-400 uppercase tracking-wider">
            Lyrics
          </h4>
          <p className="whitespace-pre-wrap font-medium text-[15px] text-zinc-200 leading-7">
            {turn.lyrics}
          </p>
        </div>

        {musicTrack && (
          <>
            <Separator className="bg-white/5" />
            <div>
              <h4 className="mb-3 font-medium text-xs text-zinc-400 uppercase tracking-wider">
                Audio
              </h4>
              <audio
                className="w-full rounded-lg ring-1 ring-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                controls
                src={musicTrack.storageUrl ?? undefined}
              >
                <track kind="captions" />
                Your browser does not support audio playback.
              </audio>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
