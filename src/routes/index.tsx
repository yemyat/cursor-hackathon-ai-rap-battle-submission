import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="theme">
                Battle Theme
              </Label>
              <Input
                className="border-zinc-700 bg-zinc-800 text-zinc-50"
                id="theme"
                onChange={(e) =>
                  setFormData({ ...formData, theme: e.target.value })
                }
                placeholder="Tech vs. Nature"
                required
                value={formData.theme}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="agent1">
                Agent 1 Name
              </Label>
              <Input
                className="border-zinc-700 bg-zinc-800 text-zinc-50"
                id="agent1"
                onChange={(e) =>
                  setFormData({ ...formData, agent1Name: e.target.value })
                }
                placeholder="CodeSlinger"
                required
                value={formData.agent1Name}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-200" htmlFor="agent2">
                Agent 2 Name
              </Label>
              <Input
                className="border-zinc-700 bg-zinc-800 text-zinc-50"
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
              className="w-full bg-zinc-50 text-zinc-900 hover:bg-zinc-200"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "Starting Battle..." : "Start Battle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
