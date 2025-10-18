import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/theme/$themeId")({
  component: ThemeBattles,
});

function ThemeBattles() {
  const { themeId } = Route.useParams();
  const navigate = useNavigate();
  const theme = useQuery(api.themes.getTheme, {
    themeId: themeId as Id<"themes">,
  });
  const battles = useQuery(api.rapBattle.getBattlesForTheme, {
    themeId: themeId as Id<"themes">,
  });
  const currentUser = useQuery(api.users.getCurrentUser);
  const createBattle = useMutation(api.rapBattle.createBattle);
  const joinBattle = useMutation(api.rapBattle.joinBattle);

  const waitingBattles =
    battles?.filter((b) => b.state === "waiting_for_partner") ?? [];
  const inProgressBattles =
    battles?.filter((b) => b.state === "in_progress") ?? [];
  const completedBattles = battles?.filter((b) => b.state === "done") ?? [];

  const handleCreateBattle = async () => {
    try {
      const battleId = await createBattle({ themeId: themeId as any });
      await navigate({ to: "/battles/$battleId", params: { battleId } });
    } catch (error) {
      console.error("Failed to create battle:", error);
    }
  };

  const handleJoinBattle = async (battleId: Id<"rapBattles">) => {
    try {
      await joinBattle({ battleId });
      await navigate({ to: "/battles/$battleId", params: { battleId } });
    } catch (error) {
      console.error("Failed to join battle:", error);
    }
  };

  if (!theme) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading theme...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 p-6">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mb-8">
        <Link to="/battles">
          <Button
            className="mb-4 text-zinc-400 hover:text-zinc-300"
            variant="ghost"
          >
            ← Back to Themes
          </Button>
        </Link>
        <h1 className="mb-2 font-semibold text-4xl text-zinc-50 tracking-tight md:text-5xl">
          {theme.name}
        </h1>
        <p className="text-[15px] text-zinc-400">{theme.description}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-bold text-brand-cyan">{theme.side1Name}</span>
          <span className="font-bold text-xs text-zinc-600">VS</span>
          <span className="font-bold text-brand-purple">{theme.side2Name}</span>
        </div>
      </div>

      <div className="mb-6">
        <Button
          className="border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
          onClick={handleCreateBattle}
          variant="outline"
        >
          Create New Battle
        </Button>
      </div>

      <Tabs className="w-full" defaultValue="waiting">
        <TabsList className="mb-6 border-zinc-800/60 bg-zinc-900/60">
          <TabsTrigger value="waiting">
            Waiting for Partner ({waitingBattles.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressBattles.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedBattles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {waitingBattles.map((battle) => {
              const isOwn = battle.partner1UserId === currentUser?._id;
              return (
                <Card
                  className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm"
                  key={battle._id}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-50">
                      Waiting for opponent...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Created by</span>
                      <span className="font-medium text-zinc-300">
                        {isOwn ? "You" : "Someone"}
                      </span>
                    </div>
                    {isOwn ? (
                      <Link
                        params={{ battleId: battle._id }}
                        to="/battles/$battleId"
                      >
                        <Button
                          className="w-full border-zinc-700/60 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800/70"
                          variant="outline"
                        >
                          View Battle
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="w-full border-brand-purple/60 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
                        onClick={() => handleJoinBattle(battle._id)}
                        variant="outline"
                      >
                        Join Battle
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {waitingBattles.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-zinc-500">No battles waiting for partners</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in-progress">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inProgressBattles.map((battle) => (
              <Link
                key={battle._id}
                params={{ battleId: battle._id }}
                to="/battles/$battleId"
              >
                <Card className="mesh-card hover:-translate-y-1 border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-50">
                      Battle in Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-300">
                        {battle.agent1Name}
                      </span>
                      <span className="font-bold text-xs text-zinc-600">
                        VS
                      </span>
                      <span className="font-medium text-zinc-300">
                        {battle.agent2Name}
                      </span>
                    </div>
                    <Badge
                      className="rounded-full border-zinc-700/60 bg-zinc-900/70 px-2.5 py-1 text-[12px] text-zinc-300"
                      variant="outline"
                    >
                      Round {battle.currentRound}/3
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {inProgressBattles.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-zinc-500">No battles in progress</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedBattles.map((battle) => (
              <Link
                key={battle._id}
                params={{ battleId: battle._id }}
                to="/battles/$battleId"
              >
                <Card className="mesh-card hover:-translate-y-1 border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-50">
                      Battle Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-300">
                        {battle.agent1Name}
                      </span>
                      <span className="font-bold text-xs text-zinc-600">
                        VS
                      </span>
                      <span className="font-medium text-zinc-300">
                        {battle.agent2Name}
                      </span>
                    </div>
                    <Badge
                      className="rounded-full border-brand-mint/50 bg-brand-mint/10 px-2.5 py-1 text-[12px] text-brand-mint"
                      variant="outline"
                    >
                      Completed
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {completedBattles.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <p className="text-zinc-500">No completed battles yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
