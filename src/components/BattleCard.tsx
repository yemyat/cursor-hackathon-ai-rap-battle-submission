import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Id } from "../../convex/_generated/dataModel";

type BattleCardProps = {
  theme: {
    _id: Id<"themes">;
    side1Name: string;
    side2Name: string;
    description: string;
  };
  onCreateBattle: (themeId: Id<"themes">) => void;
  onViewBattles: (themeId: Id<"themes">) => void;
};

export function BattleCard({
  theme,
  onCreateBattle,
  onViewBattles,
}: BattleCardProps) {
  return (
    <Card className="overflow-hidden border-none">
      <CardHeader className="">
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <h2 className="font-bold text-5xl text-white leading-tight">
            {theme.side1Name}
          </h2>
          <span className="font-bold text-sm text-white/60 tracking-wider">
            VS
          </span>
          <h2 className="font-bold text-5xl text-white leading-tight">
            {theme.side2Name}
          </h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <p className="text-center text-sm text-white/90 leading-relaxed">
          {theme.description}
        </p>

        <div className="grid gap-2 pt-2">
          <Button
            className="h-10 w-full border-0 bg-white font-semibold text-sm text-zinc-950 hover:bg-white/90"
            onClick={() => onCreateBattle(theme._id)}
          >
            Create Battle
          </Button>

          <Button
            className="h-10 w-full border-2 border-white/20 bg-transparent font-semibold text-sm text-white hover:bg-white/10"
            onClick={() => onViewBattles(theme._id)}
            variant="outline"
          >
            View Battles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
