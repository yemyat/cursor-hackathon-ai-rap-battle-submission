import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { BattleCard } from "@/components/BattleCard";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/")({
  component: ThemesList,
});

function ThemesList() {
  const themes = useQuery(api.themes.listThemes);
  const completedBattlesCount = useQuery(api.rapBattle.countCompletedBattles);
  const createBattle = useMutation(api.rapBattle.createBattle);
  const navigate = useNavigate();

  const handleCreateBattle = async (themeId: Id<"themes">) => {
    try {
      const battleId = await createBattle({ themeId });
      await navigate({ to: "/battles/$battleId", params: { battleId } });
      toast.success("Battle created! Waiting for opponent...");
    } catch {
      toast.error("Failed to create battle. Please try again.");
    }
  };

  const handleViewBattles = async (themeId: Id<"themes">) => {
    await navigate({ to: "/battles/theme/$themeId", params: { themeId } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0d0d]">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 size-[600px] rounded-full bg-brand-coral opacity-10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 size-[600px] rounded-full bg-brand-coralLight opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 px-6 py-12">
        {/* Hero Section */}
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div className="mb-6">
              <h1 className="mb-4 bg-gradient-to-r from-brand-coral via-brand-coralLight to-brand-coral bg-clip-text font-bold text-6xl text-transparent tracking-[-0.03em] md:text-7xl lg:text-8xl">
                Enter the Arena
              </h1>
              <p className="mx-auto max-w-2xl font-medium text-lg text-white leading-relaxed md:text-xl">
                Battle. Compete. Dominate.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-base text-white md:text-lg">
                AI-powered rap battles where only the strongest verses survive.
                Choose your side and prove your dominance.
              </p>
            </div>

            {/* Decorative line */}
            <div className="mx-auto my-8 h-px w-32 bg-gradient-to-r from-transparent via-brand-coral to-transparent" />
          </div>

          {/* Stats Bar */}
          <div className="mb-16">
            <div className="mx-auto grid max-w-4xl gap-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-8 backdrop-blur-sm md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 font-bold text-3xl text-brand-coral md:text-4xl">
                  {completedBattlesCount ?? 0}
                </div>
                <div className="font-medium text-sm text-zinc-400 uppercase tracking-wider">
                  Battles Fought
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-bold text-3xl text-brand-coral md:text-4xl">
                  ● Live
                </div>
                <div className="font-medium text-sm text-zinc-400 uppercase tracking-wider">
                  Real-Time Combat
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 font-bold text-3xl text-brand-coral md:text-4xl">
                  AI
                </div>
                <div className="font-medium text-sm text-zinc-400 uppercase tracking-wider">
                  Powered Verses
                </div>
              </div>
            </div>
          </div>

          {/* Battle Themes Section */}
          <div className="mb-12">
            <h2 className="mb-3 font-bold text-4xl text-white tracking-[-0.02em] md:text-5xl">
              Battle Themes
            </h2>
            <p className="text-lg text-zinc-400 md:text-xl">
              Choose your battlefield and challenge opponents
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {themes?.map((theme) => (
              <BattleCard
                key={theme._id}
                onCreateBattle={handleCreateBattle}
                onViewBattles={handleViewBattles}
                theme={theme}
              />
            ))}

            {themes?.length === 0 && (
              <div className="col-span-full rounded-lg border border-zinc-800 bg-zinc-900 py-20 text-center">
                <p className="font-medium text-sm text-zinc-500">
                  No themes available
                </p>
                <p className="mt-1 text-[13px] text-zinc-600">
                  Themes need to be seeded
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
