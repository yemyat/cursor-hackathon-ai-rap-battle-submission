import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const roundTurns = turns?.filter((t) => t.roundNumber === selectedRound) ?? [];
  const agent1Turn = roundTurns.find((t) => t.agentName === battle.agent1Name);
  const agent2Turn = roundTurns.find((t) => t.agentName === battle.agent2Name);

  // Calculate total rounds that have at least one turn
  const maxRound = Math.max(...(turns?.map((t) => t.roundNumber) ?? [1]), 1);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="mx-auto mb-8 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl text-zinc-50">{battle.theme}</h1>
            <p className="text-zinc-400">Rap Battle</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              className="border-zinc-700 bg-zinc-800 text-zinc-50"
              variant="outline"
            >
              Round {battle.currentRound}/3
            </Badge>
            <Badge
              className={(() => {
                if (battle.state === "done") {
                  return "border-green-700 bg-green-900/20 text-green-400";
                }
                if (battle.state === "in_progress") {
                  return "border-blue-700 bg-blue-900/20 text-blue-400";
                }
                return "border-zinc-700 bg-zinc-800 text-zinc-400";
              })()}
              variant="outline"
            >
              {battle.state === "done" && "Complete"}
              {battle.state === "in_progress" && "In Progress"}
              {battle.state === "preparing" && "Preparing"}
            </Badge>
          </div>
        </div>

        {/* Round Navigation */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
            disabled={selectedRound === 1}
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-zinc-400">
            Viewing Round {selectedRound} of {maxRound}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedRound(Math.min(maxRound, selectedRound + 1))}
            disabled={selectedRound === maxRound}
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Split Screen */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6">
        {/* Agent 1 */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-center text-zinc-50">
                {battle.agent1Name}
              </CardTitle>
            </CardHeader>
          </Card>

          {agent1Turn ? (
            <TurnCard turn={agent1Turn} />
          ) : (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="py-12 text-center text-zinc-500">
                Waiting for verse...
              </CardContent>
            </Card>
          )}
        </div>

        {/* Agent 2 */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-center text-zinc-50">
                {battle.agent2Name}
              </CardTitle>
            </CardHeader>
          </Card>

          {agent2Turn ? (
            <TurnCard turn={agent2Turn} />
          ) : (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="py-12 text-center text-zinc-500">
                Waiting for verse...
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
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge
            className="border-zinc-700 bg-zinc-800 text-zinc-400"
            variant="outline"
          >
            Round {turn.roundNumber} - Turn {turn.turnNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 font-semibold text-sm text-zinc-400">Lyrics</h4>
          <p className="whitespace-pre-wrap text-zinc-200">{turn.lyrics}</p>
        </div>

        {musicTrack && (
          <>
            <Separator className="bg-zinc-800" />
            <div>
              <h4 className="mb-2 font-semibold text-sm text-zinc-400">
                Audio
              </h4>
              <audio
                className="w-full"
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
