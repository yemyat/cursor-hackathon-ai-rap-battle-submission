import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "../../../convex/_generated/api";
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
};

export function TurnCard({ turn }: TurnCardProps) {
  const musicTrack = useQuery(api.rapBattle.getMusicTrack, {
    trackId: turn.musicTrackId,
  });

  return (
    <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-white/5 backdrop-blur-xl">
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

        {musicTrack && (
          <>
            <Separator className="bg-tokyo-terminal/60" />
            <div>
              <h4 className="mb-3 font-medium text-[11px] text-tokyo-comment uppercase tracking-wider">
                Audio
              </h4>
              <audio
                className="w-full rounded-lg ring-1 ring-tokyo-terminal/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tokyo-blue/50"
                controls
                src={musicTrack.storageUrl ?? undefined}
              >
                <track kind="captions" />
                Your browser does not support audio playback.
              </audio>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
