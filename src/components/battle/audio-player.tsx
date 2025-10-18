import { useMutation } from "convex/react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Turn } from "./turn-card";

type AudioPlayerProps = {
  audioRef: RefObject<HTMLAudioElement>;
  currentTurn: Turn | null;
  agent1Name: string;
  agent2Name: string;
  agent1Turn: Turn | undefined;
  agent2Turn: Turn | undefined;
  hasAgent1Track: boolean;
  hasAgent2Track: boolean;
  onAudioEnded: () => void;
  onAudioPlay: () => void;
  onAudioPause: () => void;
  onPlayAgent1?: () => void;
  onPlayAgent2?: () => void;
  battleId: Id<"rapBattles">;
  isCheerleader: boolean;
  isRoundComplete: boolean;
};

export function AudioPlayer({
  audioRef,
  currentTurn,
  agent1Name,
  agent2Name,
  agent1Turn,
  agent2Turn,
  hasAgent1Track,
  hasAgent2Track,
  onAudioEnded,
  onAudioPlay,
  onAudioPause,
  onPlayAgent1,
  onPlayAgent2,
  battleId,
  isCheerleader,
  isRoundComplete,
}: AudioPlayerProps) {
  const sendCheer = useMutation(api.cheers.sendCheer);

  const handleCheer = async (cheerType: "applause" | "boo" | "fire") => {
    try {
      const agentName = currentTurn?.agentName || agent1Name;
      await sendCheer({ battleId, agentName, cheerType });
    } catch {
      toast.error("Failed to send cheer. Please try again.");
    }
  };
  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-tokyo-terminal/50 border-t bg-tokyo-bgDark/95 p-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex-1">
          {currentTurn ? (
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${
                  currentTurn.agentName === agent1Name
                    ? "bg-tokyo-blue shadow-[0_0_8px_rgba(122,162,247,0.6)]"
                    : "bg-tokyo-magenta shadow-[0_0_8px_rgba(187,154,247,0.6)]"
                }`}
              />
              <div>
                <p className="font-medium text-sm text-tokyo-fg">
                  {currentTurn.agentName}
                </p>
                <p className="text-[11px] text-tokyo-comment">
                  Round {currentTurn.roundNumber} · Turn{" "}
                  {currentTurn.turnNumber}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-tokyo-terminal" />
              <p className="text-sm text-tokyo-comment">
                {(() => {
                  if (onPlayAgent1 && (agent1Turn || agent2Turn)) {
                    return "Click play to start";
                  }
                  if (agent1Turn || agent2Turn) {
                    return "Auto-playing...";
                  }
                  return "Waiting for verses...";
                })()}
              </p>
            </div>
          )}
        </div>

        <audio
          className="hidden"
          onEnded={onAudioEnded}
          onPause={onAudioPause}
          onPlay={onAudioPlay}
          ref={audioRef}
        >
          <track kind="captions" />
        </audio>

        <div className="flex gap-2">
          {onPlayAgent1 && onPlayAgent2 ? (
            <>
              <Button
                className="rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-4 py-2 text-sm text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={agent1Turn === undefined || !hasAgent1Track}
                onClick={onPlayAgent1}
                variant="outline"
              >
                Play {agent1Name}
              </Button>
              <Button
                className="rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-4 py-2 text-sm text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-magenta/60 hover:bg-tokyo-terminal hover:text-tokyo-magenta focus-visible:ring-2 focus-visible:ring-tokyo-magenta/50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={agent2Turn === undefined || !hasAgent2Track}
                onClick={onPlayAgent2}
                variant="outline"
              >
                Play {agent2Name}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-tokyo-terminal/80 bg-tokyo-terminal/60 px-4 py-2 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-tokyo-green" />
              <span className="text-sm text-tokyo-comment">
                Workflow Auto-Play
              </span>
            </div>
          )}

          {isCheerleader && (
            <>
              <div className="mx-2 w-px bg-tokyo-terminal/50" />
              <Button
                className="rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-3 py-2 text-lg backdrop-blur-sm transition-all duration-200 hover:border-tokyo-green/60 hover:bg-tokyo-terminal hover:text-tokyo-green focus-visible:ring-2 focus-visible:ring-tokyo-green/50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isRoundComplete}
                onClick={() => handleCheer("applause")}
                title="Applause"
                variant="outline"
              >
                👏
              </Button>
              <Button
                className="rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-3 py-2 text-lg backdrop-blur-sm transition-all duration-200 hover:border-tokyo-orange/60 hover:bg-tokyo-terminal hover:text-tokyo-orange focus-visible:ring-2 focus-visible:ring-tokyo-orange/50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isRoundComplete}
                onClick={() => handleCheer("fire")}
                title="Fire"
                variant="outline"
              >
                🔥
              </Button>
              <Button
                className="rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-3 py-2 text-lg backdrop-blur-sm transition-all duration-200 hover:border-tokyo-red/60 hover:bg-tokyo-terminal hover:text-tokyo-red focus-visible:ring-2 focus-visible:ring-tokyo-red/50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isRoundComplete}
                onClick={() => handleCheer("boo")}
                title="Boo"
                variant="outline"
              >
                👎
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
