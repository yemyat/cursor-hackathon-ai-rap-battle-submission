import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { BattleThemeCard } from "@/components/BattleThemeCard";
import { Button } from "@/components/ui/button";
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
    <div className="relative min-h-screen overflow-hidden bg-[#0d0d0d]">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 size-[600px] rounded-full bg-brand-coral opacity-10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 size-[600px] rounded-full bg-brand-coralLight opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 py-12">
        <div className="mb-12">
          <Link to="/battles">
            <Button
              className="mb-6 text-zinc-400 hover:text-zinc-300"
              variant="ghost"
            >
              ← Back to Themes
            </Button>
          </Link>

          <div className="text-center">
            <h1 className="mb-4 bg-gradient-to-r from-brand-coral via-brand-coralLight to-brand-coral bg-clip-text font-bold text-5xl text-transparent tracking-[-0.02em] md:text-6xl">
              {theme.name}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">{theme.description}</p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="font-bold text-2xl text-brand-coral">{theme.side1Name}</span>
              <span className="font-bold text-sm text-brand-coral/60">VS</span>
              <span className="font-bold text-2xl text-brand-coral">{theme.side2Name}</span>
            </div>

            {/* Decorative line */}
            <div className="mx-auto my-8 h-px w-32 bg-gradient-to-r from-transparent via-brand-coral to-transparent" />
          </div>
        </div>

        <div className="mb-12 text-center">
          <Button
            className="h-14 px-12 border-0 bg-brand-coral font-bold text-xl text-white hover:bg-brand-coralDark shadow-lg shadow-brand-coral/30 hover:shadow-xl hover:shadow-brand-coral/40 transition-all"
            onClick={handleCreateBattle}
            size="lg"
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
                  <BattleThemeCard
                    battle={battle}
                    currentUserId={currentUser?._id}
                    key={battle._id}
                    onJoin={handleJoinBattle}
                  />
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
                  <BattleThemeCard
                    battle={battle}
                    currentUserId={currentUser?._id}
                    key={battle._id}
                    onView={handleViewBattle}
                  />
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
                  <BattleThemeCard
                    battle={battle}
                    currentUserId={currentUser?._id}
                    key={battle._id}
                    onView={handleViewBattle}
                  />
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
    </div>
  );
}
