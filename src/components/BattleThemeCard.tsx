import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Id } from "../../convex/_generated/dataModel";

type BattleState = "waiting_for_partner" | "preparing" | "in_progress" | "done";

type BattleThemeCardProps = {
  battle: {
    _id: Id<"rapBattles">;
    state: BattleState;
    creatorUsername: string;
    agent1Name?: string;
    agent2Name?: string;
    currentRound: number;
    partner1UserId: Id<"users">;
  };
  currentUserId?: Id<"users">;
  onJoin?: (battleId: Id<"rapBattles">) => void;
  onView?: (battleId: Id<"rapBattles">) => void;
};

export function BattleThemeCard({
  battle,
  currentUserId,
  onJoin,
  onView,
}: BattleThemeCardProps) {
  const isWaiting = battle.state === "waiting_for_partner";
  const isUserBattle = battle.partner1UserId === currentUserId;
  const isClickable = !isWaiting && onView;

  const getBadge = () => {
    switch (battle.state) {
      case "waiting_for_partner":
        return (
          <Badge className="border-0 bg-amber-500 font-semibold text-white">
            Waiting
          </Badge>
        );
      case "preparing":
        return (
          <Badge className="border-0 bg-blue-500 font-semibold text-white">
            Preparing
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="border-0 bg-green-500 font-semibold text-white">
            In Progress
          </Badge>
        );
      case "done":
        return (
          <Badge className="border-0 bg-zinc-500 font-semibold text-white">
            Done
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={`overflow-hidden border-none ${isClickable ? "cursor-pointer" : ""}`}
      onClick={isClickable ? () => onView?.(battle._id) : undefined}
    >
      <CardHeader className="t-6 pb-8">
        <div className="flex items-start justify-between">{getBadge()}</div>
        {!isWaiting && battle.agent1Name && battle.agent2Name ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center">
            <h3 className="font-bold text-3xl text-white leading-tight">
              {battle.agent1Name}
            </h3>
            <span className="font-bold text-sm text-white/60 tracking-wider">
              VS
            </span>
            <h3 className="font-bold text-3xl text-white leading-tight">
              {battle.agent2Name}
            </h3>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <h3 className="font-bold text-2xl text-white/90">
              Looking for opponent...
            </h3>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Created by</span>
            <span className="font-medium text-white">
              {battle.creatorUsername}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Round</span>
            <span className="font-medium text-white">
              {battle.currentRound}
            </span>
          </div>
        </div>

        <div className="pt-2">
          {isWaiting ? (
            isUserBattle ? (
              <Button
                className="h-10 w-full border-white/20 bg-white/10 font-semibold text-white/50"
                disabled
                variant="outline"
              >
                Your Battle
              </Button>
            ) : (
              <Button
                className="h-10 w-full border-0 bg-white font-semibold text-zinc-950 hover:bg-white/90"
                onClick={() => onJoin?.(battle._id)}
              >
                Join Battle
              </Button>
            )
          ) : (
            <Button
              className="h-10 w-full border-2 border-white/20 bg-transparent font-semibold text-white hover:bg-white/10"
              variant="outline"
            >
              View Battle
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
