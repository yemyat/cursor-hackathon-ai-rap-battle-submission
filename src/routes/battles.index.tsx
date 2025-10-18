import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/battles/")({
  component: BattlesList,
});

function BattlesList() {
  const battles = useQuery(api.rapBattle.listBattles);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl text-zinc-50">Rap Battles</h1>
            <p className="text-zinc-400">All AI rap battle showdowns</p>
          </div>
          <Link to="/battles/create">
            <Button className="bg-zinc-50 text-zinc-900 hover:bg-zinc-200">
              Create Battle
            </Button>
          </Link>
        </div>

        {/* Battles Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {battles?.map((battle) => (
            <Link
              key={battle._id}
              to="/battles/$battleId"
              params={{ battleId: battle._id }}
            >
              <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-zinc-50">{battle.theme}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{battle.agent1Name}</span>
                    <span className="text-zinc-600">vs</span>
                    <span className="text-zinc-400">{battle.agent2Name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-zinc-700 bg-zinc-800 text-zinc-400"
                    >
                      Round {battle.currentRound}/3
                    </Badge>
                    <Badge
                      variant="outline"
                      className={(() => {
                        if (battle.state === "done") {
                          return "border-green-700 bg-green-900/20 text-green-400";
                        }
                        if (battle.state === "in_progress") {
                          return "border-blue-700 bg-blue-900/20 text-blue-400";
                        }
                        return "border-zinc-700 bg-zinc-800 text-zinc-400";
                      })()}
                    >
                      {battle.state === "done" && "Complete"}
                      {battle.state === "in_progress" && "In Progress"}
                      {battle.state === "preparing" && "Preparing"}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-500">
                    {new Date(battle.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {battles?.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500">
              No battles yet. Create your first battle!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
