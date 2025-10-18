import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type CheerDisplayProps = {
  battleId: Id<"rapBattles">;
  isReplayMode?: boolean;
  agent1Name?: string;
  agent2Name?: string;
  currentRound?: number;
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

export function CheerDisplay({
  battleId,
  isReplayMode = false,
  agent1Name = "",
  agent2Name = "",
  currentRound,
}: CheerDisplayProps) {
  const recentCheers = useQuery(api.cheers.getRecentCheers, { battleId });
  const cheerStats = useQuery(api.cheers.getCheerStats, { battleId });
  const allCheers = useQuery(api.cheers.getCheersForBattle, { battleId });
  const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);
  const previousCheersRef = useRef<string[]>([]);

  // Calculate scores per agent in replay mode
  const calculateScoreByAgent = (
    cheers: typeof allCheers,
    agentName: string
  ) => {
    if (!cheers) {
      return 0;
    }
    return cheers
      .filter((c) => c.agentName === agentName)
      .reduce((score, cheer) => {
        if (cheer.cheerType === "applause") {
          return score + 1;
        }
        if (cheer.cheerType === "fire") {
          return score + 2;
        }
        if (cheer.cheerType === "boo") {
          return score - 1;
        }
        return score;
      }, 0);
  };

  const agent1TotalScore = calculateScoreByAgent(allCheers, agent1Name);
  const agent2TotalScore = calculateScoreByAgent(allCheers, agent2Name);

  const roundCheers = allCheers?.filter((c) => c.roundNumber === currentRound);
  const agent1RoundScore = calculateScoreByAgent(roundCheers, agent1Name);
  const agent2RoundScore = calculateScoreByAgent(roundCheers, agent2Name);

  // Determine winner
  let winner: string | null = null;
  if (agent1TotalScore > agent2TotalScore) {
    winner = agent1Name;
  } else if (agent2TotalScore > agent1TotalScore) {
    winner = agent2Name;
  }

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
      {!isReplayMode &&
        flyingEmojis.map((emoji) => (
          <div
            className="pointer-events-none absolute bottom-0 animate-fly-up text-4xl"
            key={emoji.id}
            style={{ left: `${emoji.left}%` }}
          >
            {emoji.emoji}
          </div>
        ))}
      <CardHeader>
        <CardTitle className="text-tokyo-fg text-xl">
          {isReplayMode ? "Battle Results" : "Crowd Reactions"}
        </CardTitle>
        {isReplayMode && (
          <p className="text-sm text-tokyo-comment">👏 +1 · 🔥 +2 · 👎 -1</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isReplayMode ? (
          <>
            {/* Winner Display */}
            <div className="space-y-3">
              {winner ? (
                <div className="rounded-lg border border-tokyo-green/50 bg-tokyo-green/10 p-4">
                  <div className="text-center">
                    <div className="mb-2 text-4xl">🏆</div>
                    <p className="font-bold text-2xl text-tokyo-green">
                      {winner} Wins!
                    </p>
                    <p className="mt-2 text-sm text-tokyo-comment">
                      Crowd Favorite
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-tokyo-terminal/30 bg-tokyo-terminal/20 p-4">
                  <div className="text-center">
                    <p className="font-bold text-tokyo-fg text-xl">
                      It's a Tie!
                    </p>
                    <p className="mt-1 text-sm text-tokyo-comment">
                      Both agents scored equally
                    </p>
                  </div>
                </div>
              )}

              {/* Agent Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`rounded-lg border p-3 ${
                    winner === agent1Name
                      ? "border-tokyo-blue/50 bg-tokyo-blue/10"
                      : "border-tokyo-terminal/30 bg-tokyo-terminal/20"
                  }`}
                >
                  <p className="text-sm text-tokyo-comment">{agent1Name}</p>
                  <p
                    className={`font-bold text-2xl ${
                      winner === agent1Name
                        ? "text-tokyo-blue"
                        : "text-tokyo-fg"
                    }`}
                  >
                    {agent1TotalScore}
                  </p>
                </div>
                <div
                  className={`rounded-lg border p-3 ${
                    winner === agent2Name
                      ? "border-tokyo-magenta/50 bg-tokyo-magenta/10"
                      : "border-tokyo-terminal/30 bg-tokyo-terminal/20"
                  }`}
                >
                  <p className="text-sm text-tokyo-comment">{agent2Name}</p>
                  <p
                    className={`font-bold text-2xl ${
                      winner === agent2Name
                        ? "text-tokyo-magenta"
                        : "text-tokyo-fg"
                    }`}
                  >
                    {agent2TotalScore}
                  </p>
                </div>
              </div>

              {currentRound && (
                <div className="rounded-lg border border-tokyo-terminal/30 bg-tokyo-terminal/20 p-3">
                  <p className="mb-2 text-center text-sm text-tokyo-comment">
                    Round {currentRound} Scores
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-tokyo-comment text-xs">{agent1Name}</p>
                      <p className="font-bold text-lg text-tokyo-blue">
                        {agent1RoundScore}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-tokyo-comment text-xs">{agent2Name}</p>
                      <p className="font-bold text-lg text-tokyo-magenta">
                        {agent2RoundScore}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Breakdown */}
            <div className="flex justify-around border-tokyo-terminal/30 border-t pt-3">
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
          </>
        ) : (
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
        )}

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
              {isReplayMode
                ? "No reactions recorded for this battle."
                : "No reactions yet. Be the first to cheer!"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
