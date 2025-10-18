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
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-4 text-center backdrop-blur-xl">
        <p className="font-bold text-2xl text-brand-coral">
          🎉 Battle Complete!
        </p>
        <p className="mt-2 text-base text-white/70">All 3 rounds finished</p>
      </div>
    );
  }

  if (battleState !== "in_progress") {
    return null;
  }

  // Determine current stage
  if (playbackState === "playing" && currentlyPlayingAgentName) {
    return (
      <div className="rounded-lg border border-brand-coral/50 bg-brand-coral/10 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-brand-coral shadow-[0_0_12px_rgba(239,116,91,0.8)]" />
          <p className="font-semibold text-lg text-white">
            🎵 Playing {currentlyPlayingAgentName}'s verse...
          </p>
        </div>
        <p className="mt-2 text-center text-sm text-white/70">
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
      <div className="rounded-lg border border-brand-coralLight/50 bg-brand-coralLight/10 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-brand-coralLight shadow-[0_0_12px_rgba(247,145,122,0.8)]" />
          <p className="font-semibold text-lg text-white">
            {isYourTurn
              ? "⏳ Your turn to give instructions"
              : `⏳ Waiting for ${partnerName}...`}
          </p>
        </div>
        <p className="mt-2 text-center text-sm text-white/70">
          Round {currentRound} of 3
        </p>
      </div>
    );
  }

  // Generating lyrics/music
  return (
    <div className="rounded-lg border border-brand-coralDark/50 bg-brand-coralDark/10 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-center gap-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-brand-coralDark shadow-[0_0_12px_rgba(217,107,84,0.8)]" />
        <p className="font-semibold text-lg text-white">
          🎤 Generating lyrics and music...
        </p>
      </div>
      <p className="mt-2 text-center text-sm text-white/70">
        Round {currentRound} of 3
      </p>
    </div>
  );
}
