import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CheerDisplayProps = {
  battleId: Id<"rapBattles">;
};

const CHEER_ICONS = {
  applause: "👏",
  boo: "👎",
  fire: "🔥",
} as const;

const EMOJI_POSITION_RANGE = 80;
const EMOJI_POSITION_OFFSET = 10;
const EMOJI_DURATION_MS = 3000;

type FlyingEmoji = {
  id: string;
  emoji: string;
  left: number;
};

export function CheerDisplay({ battleId }: CheerDisplayProps) {
  const recentCheers = useQuery(api.cheers.getRecentCheers, { battleId });
  const cheerStats = useQuery(api.cheers.getCheerStats, { battleId });
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const previousCheersRef = useRef<string[]>([]);

  useEffect(() => {
    if (!recentCheers) {
      return;
    }

    const currentCheerIds = recentCheers.map((c) => c._id);
    const newCheers = recentCheers.filter(
      (cheer) => !previousCheersRef.current.includes(cheer._id)
    );

    if (newCheers.length > 0 && previousCheersRef.current.length > 0) {
      const newEmojis = newCheers.map((cheer) => ({
        id: `${cheer._id}-${Date.now()}`,
        emoji: CHEER_ICONS[cheer.cheerType],
        left: Math.random() * EMOJI_POSITION_RANGE + EMOJI_POSITION_OFFSET,
      }));

      setFlyingEmojis((prev) => [...prev, ...newEmojis]);

      setTimeout(() => {
        setFlyingEmojis((prev) =>
          prev.filter((e) => !newEmojis.find((ne) => ne.id === e.id))
        );
      }, EMOJI_DURATION_MS);
    }

    previousCheersRef.current = currentCheerIds;
  }, [recentCheers]);

  return (
    <Card className="mesh-card relative overflow-hidden border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-magenta/10 backdrop-blur-xl">
      {flyingEmojis.map((emoji) => (
        <div
          className="pointer-events-none absolute bottom-0 animate-fly-up text-4xl"
          key={emoji.id}
          style={{ left: `${emoji.left}%` }}
        >
          {emoji.emoji}
        </div>
      ))}
      <CardHeader>
        <CardTitle className="text-tokyo-fg text-xl">Crowd Reactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-around border-tokyo-terminal/30 border-b pb-3">
          <div className="text-center">
            <div className="text-2xl">{CHEER_ICONS.applause}</div>
            <div className="mt-1 font-bold text-tokyo-fg text-xl">
              {cheerStats?.applause ?? 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl">{CHEER_ICONS.fire}</div>
            <div className="mt-1 font-bold text-tokyo-fg text-xl">
              {cheerStats?.fire ?? 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl">{CHEER_ICONS.boo}</div>
            <div className="mt-1 font-bold text-tokyo-fg text-xl">
              {cheerStats?.boo ?? 0}
            </div>
          </div>
        </div>

        <div className="max-h-[200px] space-y-2 overflow-y-auto">
          {recentCheers?.map((cheer) => (
            <div
              className="slide-in-from-bottom-2 flex animate-in items-center gap-2 rounded border border-tokyo-terminal/30 bg-tokyo-bgDark/60 p-2"
              key={cheer._id}
            >
              <span className="text-xl">{CHEER_ICONS[cheer.cheerType]}</span>
              <span className="text-sm text-tokyo-comment">
                {cheer.username}
              </span>
              <span className="ml-auto text-tokyo-fgDark text-xs">
                {new Date(cheer.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {(!recentCheers || recentCheers.length === 0) && (
            <p className="py-4 text-center text-sm text-tokyo-comment">
              No reactions yet. Be the first to cheer!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
