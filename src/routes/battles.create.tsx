import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/battles/create")({
  component: CreateBattle,
});

function CreateBattle() {
  const navigate = useNavigate();
  const startBattle = useMutation(api.rapBattle.startRapBattle);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    theme: "",
    agent1Name: "",
    agent2Name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const battleId = await startBattle({
        theme: formData.theme,
        agent1Name: formData.agent1Name,
        agent2Name: formData.agent2Name,
      });

      navigate({ to: `/battles/${battleId}` });
    } catch (_error) {
      // Ignore error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen animate-fade-up items-center justify-center bg-zinc-950 p-4">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <Card className="mesh-card w-full max-w-lg border-zinc-800/60 bg-zinc-950/60 ring-1 ring-white/5 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-center font-semibold text-4xl text-zinc-50 tracking-tight">
            Create Battle
          </CardTitle>
          <p className="mt-2 text-center text-[15px] text-zinc-400">
            Set up an epic AI rap battle showdown
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label
                className="font-medium text-sm text-zinc-300"
                htmlFor="theme"
              >
                Battle Theme
              </Label>
              <Input
                className="h-11 border-zinc-700/60 bg-zinc-900/70 text-zinc-50 ring-1 ring-white/5 transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
                id="theme"
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value })
                }
                placeholder="Tech vs. Nature"
                required
                value={formData.theme}
              />
            </div>

            <div className="space-y-3">
              <Label
                className="font-medium text-sm text-zinc-300"
                htmlFor="agent1"
              >
                Agent 1 Name
              </Label>
              <Input
                className="h-11 border-zinc-700/60 bg-zinc-900/70 text-zinc-50 ring-1 ring-white/5 transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
                id="agent1"
                onChange={(e) =>
                  setFormData({ ...formData, agent1Name: e.target.value })
                }
                placeholder="CodeSlinger"
                required
                value={formData.agent1Name}
              />
            </div>

            <div className="space-y-3">
              <Label
                className="font-medium text-sm text-zinc-300"
                htmlFor="agent2"
              >
                Agent 2 Name
              </Label>
              <Input
                className="h-11 border-zinc-700/60 bg-zinc-900/70 text-zinc-50 ring-1 ring-white/5 transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
                id="agent2"
                onChange={(e) =>
                  setFormData({ ...formData, agent2Name: e.target.value })
                }
                placeholder="EarthMC"
                required
                value={formData.agent2Name}
              />
            </div>

            <Button
              className="group glow-primary relative mt-8 h-12 w-full overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/40 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:hover:scale-100"
              disabled={isLoading}
              type="submit"
            >
              <span className="relative z-10">
                {isLoading ? "Starting Battle..." : "Start Battle"}
              </span>
              <div className="-z-10 absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-brand-mint via-brand-cyan to-brand-mint transition-all duration-500 group-hover:bg-[position:100%_0]" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
