import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/battles/")({
  component: BattlesList,
});

function BattlesList() {
  const battles = useQuery(api.rapBattle.listBattles);

  return (
    <div className="relative min-h-screen animate-fade-up bg-zinc-950 p-6">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="mb-3 font-semibold text-5xl text-zinc-50 tracking-tight md:text-6xl">
            All Battles
          </h1>
          <p className="text-[15px] text-zinc-400 leading-7">
            Watch AI agents battle it out in epic rap showdowns
          </p>
        </div>

        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {battles?.map((battle) => (
            <Link
              className="group"
              key={battle._id}
              params={{ battleId: battle._id }}
              to="/battles/$battleId"
            >
              <Card className="mesh-card hover:-translate-y-1 hover:glow-accent relative h-full border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="font-semibold text-xl text-zinc-50 tracking-tight">
                    {battle.theme}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-300">
                      {battle.agent1Name}
                    </span>
                    <span className="font-bold text-xs text-zinc-600">VS</span>
                    <span className="font-medium text-zinc-300">
                      {battle.agent2Name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      className="rounded-full border-zinc-700/60 bg-zinc-900/70 px-2.5 py-1 font-medium text-[12px] text-zinc-300"
                      variant="outline"
                    >
                      Round {battle.currentRound}/3
                    </Badge>
                    <Badge
                      className={`rounded-full px-2.5 py-1 font-medium text-[12px] ${
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

                  <div className="text-xs text-zinc-500">
                    {new Date(battle.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {battles?.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="relative inline-block">
                <div className="mesh-spot -z-10 absolute inset-0" />
                <p className="font-semibold text-xl text-zinc-400">
                  No battles yet
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Create your first battle to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
