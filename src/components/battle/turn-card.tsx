import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Id } from "../../../convex/_generated/dataModel";

export type Turn = {
  _id: Id<"turns">;
  roundNumber: number;
  turnNumber: number;
  agentName: string;
  lyrics: string;
  musicTrackId: Id<"musicTracks">;
  threadId: string;
};

type TurnCardProps = {
  turn: Turn;
  isPlaying: boolean;
  agentColor: "blue" | "magenta";
};

export function TurnCard({ turn, isPlaying, agentColor }: TurnCardProps) {
  const ringColor =
    agentColor === "blue" ? "ring-tokyo-blue/60" : "ring-tokyo-magenta/60";
  const cardClassName = `mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 backdrop-blur-xl transition-all duration-300 ${
    isPlaying ? `ring-2 ${ringColor}` : "ring-1 ring-white/5"
  }`;

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge
            className="rounded-md border-tokyo-terminal/80 bg-tokyo-bgDark/60 px-2.5 py-1 font-medium text-[11px] text-tokyo-comment uppercase tracking-wider"
            variant="outline"
          >
            Turn {turn.turnNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <div>
          <h4 className="mb-3 font-medium text-[11px] text-tokyo-comment uppercase tracking-wider">
            Lyrics
          </h4>
          <p className="whitespace-pre-wrap font-medium text-[15px] text-tokyo-fg leading-7">
            {turn.lyrics}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
