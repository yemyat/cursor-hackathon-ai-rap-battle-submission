import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/")({
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

      navigate({ to: `/battle/${battleId}` });
    } catch (_error) {
      // Ignore error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-zinc-50">
            Create Rap Battle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-zinc-200">
                Battle Theme
              </Label>
              <Input
                id="theme"
                placeholder="Tech vs. Nature"
                value={formData.theme}
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value })
                }
                required
                className="border-zinc-700 bg-zinc-800 text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent1" className="text-zinc-200">
                Agent 1 Name
              </Label>
              <Input
                id="agent1"
                placeholder="CodeSlinger"
                value={formData.agent1Name}
                onChange={(e) =>
                  setFormData({ ...formData, agent1Name: e.target.value })
                }
                required
                className="border-zinc-700 bg-zinc-800 text-zinc-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent2" className="text-zinc-200">
                Agent 2 Name
              </Label>
              <Input
                id="agent2"
                placeholder="EarthMC"
                value={formData.agent2Name}
                onChange={(e) =>
                  setFormData({ ...formData, agent2Name: e.target.value })
                }
                required
                className="border-zinc-700 bg-zinc-800 text-zinc-50"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
              disabled={isLoading}
            >
              {isLoading ? "Starting Battle..." : "Start Battle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
