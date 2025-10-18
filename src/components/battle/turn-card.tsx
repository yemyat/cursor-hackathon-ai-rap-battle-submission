import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Id } from "../../../convex/_generated/dataModel";

export type Turn = {
  _id: Id<"turns">;
  roundNumber: number;
  turnNumber: number;
  agentName: string;
  lyrics: string;
  musicTrackId?: Id<"musicTracks">;
  threadId: string;
};

type TurnCardProps = {
  turn: Turn;
  isPlaying: boolean;
  agentColor: "blue" | "magenta";
  agentName: string;
  isYourAgent: boolean;
};

export function TurnCard({
  turn,
  isPlaying,
  agentColor,
  agentName,
  isYourAgent,
}: TurnCardProps) {
  const ringColor =
    agentColor === "blue" ? "ring-brand-coral/60" : "ring-brand-coralLight/60";
  const cardClassName = `border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 ${
    isPlaying
      ? `ring-4 ${ringColor} shadow-lg shadow-brand-coral/20`
      : "ring-1 ring-white/5"
  }`;

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-2xl text-brand-coral">
            {agentName}
            {isYourAgent && (
              <span className="ml-2 text-base text-white/70">(You)</span>
            )}
          </h3>
          <Badge
            className="rounded-md border-brand-coral/40 bg-brand-coral/10 px-3 py-1 font-semibold text-brand-coral text-xs uppercase tracking-wider"
            variant="outline"
          >
            Turn {turn.turnNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-2">
        <div>
          <h4 className="mb-3 font-semibold text-white/60 text-xs uppercase tracking-wider">
            Lyrics
          </h4>
          <p className="whitespace-pre-wrap text-lg text-white leading-8">
            {turn.lyrics}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
