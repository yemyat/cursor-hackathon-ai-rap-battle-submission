import type { Id } from "../../../convex/_generated/dataModel";

type BattleStatusProps = {
  currentTurnUserId?: Id<"users">;
  playbackState?: "idle" | "playing" | "completed";
  currentRound: number;
  battleState: string;
  partner1UserId?: Id<"users">;
  currentUserId?: Id<"users">;
  agent1Name: string;
  agent2Name: string;
  currentlyPlayingAgentName?: string;
};

/**
 * BattleStatus displays the current workflow stage to users
 */
export function BattleStatus({
  currentTurnUserId,
  playbackState,
  currentRound,
  battleState,
  partner1UserId,
  currentUserId,
  agent1Name,
  agent2Name,
  currentlyPlayingAgentName,
}: BattleStatusProps) {
  if (battleState === "done") {
    return (
      <div className="rounded-lg border border-tokyo-terminal/50 bg-tokyo-terminal/30 p-4 text-center backdrop-blur-xl">
        <p className="font-semibold text-lg text-tokyo-green">
          🎉 Battle Complete!
        </p>
        <p className="mt-1 text-sm text-tokyo-comment">All 3 rounds finished</p>
      </div>
    );
  }

  if (battleState !== "in_progress") {
    return null;
  }

  // Determine current stage
  if (playbackState === "playing" && currentlyPlayingAgentName) {
    return (
      <div className="rounded-lg border border-tokyo-terminal/50 bg-tokyo-terminal/30 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-tokyo-green shadow-[0_0_8px_rgba(158,206,106,0.8)]" />
          <p className="font-medium text-tokyo-fg">
            🎵 Playing {currentlyPlayingAgentName}'s verse...
          </p>
        </div>
        <p className="mt-1 text-center text-tokyo-comment text-xs">
          Round {currentRound} of 3
        </p>
      </div>
    );
  }

  if (currentTurnUserId) {
    const isYourTurn = currentUserId === currentTurnUserId;
    let partnerName = "You";
    if (!isYourTurn) {
      partnerName =
        currentTurnUserId === partner1UserId ? agent1Name : agent2Name;
    }

    return (
      <div className="rounded-lg border border-tokyo-terminal/50 bg-tokyo-terminal/30 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-tokyo-blue shadow-[0_0_8px_rgba(122,162,247,0.6)]" />
          <p className="font-medium text-tokyo-fg">
            {isYourTurn
              ? "⏳ Your turn to give instructions"
              : `⏳ Waiting for ${partnerName}...`}
          </p>
        </div>
        <p className="mt-1 text-center text-tokyo-comment text-xs">
          Round {currentRound} of 3
        </p>
      </div>
    );
  }

  // Generating lyrics/music
  return (
    <div className="rounded-lg border border-tokyo-terminal/50 bg-tokyo-terminal/30 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-tokyo-magenta shadow-[0_0_8px_rgba(187,154,247,0.6)]" />
        <p className="font-medium text-tokyo-fg">
          🎤 Generating lyrics and music...
        </p>
      </div>
      <p className="mt-1 text-center text-tokyo-comment text-xs">
        Round {currentRound} of 3
      </p>
    </div>
  );
}
