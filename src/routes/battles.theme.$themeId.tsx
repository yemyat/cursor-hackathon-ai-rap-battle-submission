import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/theme/$themeId")({
  component: ThemeBattlesPage,
});

function ThemeBattlesPage() {
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
  const doneBattles = battles?.filter((b) => b.state === "done") ?? [];
  const otherBattles =
    battles?.filter(
      (b) => b.state !== "waiting_for_partner" && b.state !== "done"
    ) ?? [];

  const handleCreateBattle = async () => {
    try {
      const battleId = await createBattle({ themeId: themeId as Id<"themes"> });
      await navigate({ to: "/battles/$battleId", params: { battleId } });
      toast.success("Battle created! Waiting for opponent...");
    } catch {
      toast.error("Failed to create battle. Please try again.");
    }
  };

  const handleJoinBattle = async (battleId: Id<"rapBattles">) => {
    try {
      await joinBattle({ battleId });
      await navigate({ to: "/battles/$battleId", params: { battleId } });
      toast.success("Joined battle!");
    } catch {
      toast.error("Failed to join battle. Please try again.");
    }
  };

  const handleViewBattle = async (battleId: Id<"rapBattles">) => {
    await navigate({ to: "/battles/$battleId", params: { battleId } });
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

      <div className="mb-8">
        <Button
          className="border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
          onClick={handleCreateBattle}
          variant="outline"
        >
          Create New Battle
        </Button>
      </div>

      {battles === undefined ? (
        <div className="py-12 text-center">
          <p className="text-zinc-400">Loading battles...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {waitingBattles.length > 0 && (
            <section>
              <h2 className="mb-4 font-semibold text-2xl text-zinc-50">
                Waiting for Partner ({waitingBattles.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {waitingBattles.map((battle) => (
                  <Card
                    className="mesh-card border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10"
                    key={battle._id}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge className="border-amber-500/60 bg-amber-500/10 text-amber-400">
                          Waiting
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500">Created by</p>
                        <p className="font-medium text-sm text-zinc-300">
                          {battle.creatorUsername}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Round {battle.currentRound}
                      </p>
                      {battle.partner1UserId === currentUser?._id ? (
                        <Button
                          className="w-full border-zinc-700/60 bg-zinc-800/40 text-zinc-400"
                          disabled
                          variant="outline"
                        >
                          Your Battle
                        </Button>
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
                ))}
              </div>
            </section>
          )}

          {otherBattles.length > 0 && (
            <section>
              <h2 className="mb-4 font-semibold text-2xl text-zinc-50">
                Active Battles ({otherBattles.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {otherBattles.map((battle) => (
                  <Card
                    className="mesh-card cursor-pointer border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10"
                    key={battle._id}
                    onClick={() => handleViewBattle(battle._id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {battle.state === "preparing" && (
                          <Badge className="border-blue-500/60 bg-blue-500/10 text-blue-400">
                            Preparing
                          </Badge>
                        )}
                        {battle.state === "in_progress" && (
                          <Badge className="border-green-500/60 bg-green-500/10 text-green-400">
                            In Progress
                          </Badge>
                        )}
                      </div>
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
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500">Initiated by</p>
                        <p className="font-medium text-sm text-zinc-300">
                          {battle.creatorUsername}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Round {battle.currentRound}
                      </p>
                      <Button
                        className="w-full border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800/60"
                        variant="outline"
                      >
                        View Battle
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {doneBattles.length > 0 && (
            <section>
              <h2 className="mb-4 font-semibold text-2xl text-zinc-50">
                Completed Battles ({doneBattles.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {doneBattles.map((battle) => (
                  <Card
                    className="mesh-card cursor-pointer border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10"
                    key={battle._id}
                    onClick={() => handleViewBattle(battle._id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Badge className="border-zinc-500/60 bg-zinc-500/10 text-zinc-400">
                          Done
                        </Badge>
                      </div>
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
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-500">Initiated by</p>
                        <p className="font-medium text-sm text-zinc-300">
                          {battle.creatorUsername}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-500">
                        Round {battle.currentRound}
                      </p>
                      <Button
                        className="w-full border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-800/60"
                        variant="outline"
                      >
                        View Battle
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {battles.length === 0 && (
            <div className="py-16 text-center">
              <div className="relative inline-block">
                <div className="mesh-spot -z-10 absolute inset-0" />
                <p className="font-semibold text-xl text-zinc-400">
                  No battles yet for this theme
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Be the first to create one!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
