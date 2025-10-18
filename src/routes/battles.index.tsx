import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/")({
  component: ThemesList,
});

function ThemesList() {
  const themes = useQuery(api.themes.listThemes);
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

  return (
    <div className="relative min-h-screen bg-zinc-950 p-6">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mb-12">
        <h1 className="mb-3 font-semibold text-5xl text-zinc-50 tracking-tight md:text-6xl">
          Battle Themes
        </h1>
        <p className="text-[15px] text-zinc-400 leading-7">
          Choose your battlefield and challenge opponents in epic rap battles
        </p>
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        {themes?.map((theme) => (
          <Card
            className="mesh-card relative h-full border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm transition-all duration-300 hover:ring-white/10"
            key={theme._id}
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-semibold text-2xl text-zinc-50 tracking-tight">
                {theme.name}
              </CardTitle>
              <p className="text-sm text-zinc-400">{theme.description}</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-center gap-3 text-lg">
                <span className="font-bold text-brand-cyan">
                  {theme.side1Name}
                </span>
                <span className="font-bold text-xs text-zinc-600">VS</span>
                <span className="font-bold text-brand-purple">
                  {theme.side2Name}
                </span>
              </div>

              <Button
                className="w-full border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
                onClick={() => handleCreateBattle(theme._id)}
                variant="outline"
              >
                Create Battle
              </Button>
            </CardContent>
          </Card>
        ))}

        {themes?.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="relative inline-block">
              <div className="mesh-spot -z-10 absolute inset-0" />
              <p className="font-semibold text-xl text-zinc-400">
                No themes available
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Themes need to be seeded
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
