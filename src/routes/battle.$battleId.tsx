import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battle/$battleId")({
  component: BattleView,
});

function BattleView() {
  const { battleId } = Route.useParams();
  const battle = useQuery(api.rapBattle.getBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const rounds = useQuery(api.rapBattle.getRoundsByBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  if (!battle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading battle...</p>
      </div>
    );
  }

  const agent1Rounds =
    rounds?.filter((r) => r.agentName === battle.agent1Name) ?? [];
  const agent2Rounds =
    rounds?.filter((r) => r.agentName === battle.agent2Name) ?? [];

  // Get the latest round from each agent
  const latestAgent1Round = agent1Rounds.at(-1);
  const latestAgent2Round = agent2Rounds.at(-1);

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
              Round {battle.currentRound}/6
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

          {latestAgent1Round ? (
            <RoundCard round={latestAgent1Round} />
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

          {latestAgent2Round ? (
            <RoundCard round={latestAgent2Round} />
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

type Round = {
  _id: Id<"rounds">;
  roundNumber: number;
  agentName: string;
  lyrics: string;
  musicTrackId: Id<"musicTracks">;
  threadId: string;
};

function RoundCard({ round }: { round: Round }) {
  const musicTrack = useQuery(api.rapBattle.getMusicTrack, {
    trackId: round.musicTrackId,
  });

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge
            className="border-zinc-700 bg-zinc-800 text-zinc-400"
            variant="outline"
          >
            Round {round.roundNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 font-semibold text-sm text-zinc-400">Lyrics</h4>
          <p className="whitespace-pre-wrap text-zinc-200">{round.lyrics}</p>
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
