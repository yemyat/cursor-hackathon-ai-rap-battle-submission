import { Pause, Play } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";

type AudioPlayerReplayProps = {
  agent1Ref: RefObject<HTMLAudioElement>;
  agent2Ref: RefObject<HTMLAudioElement>;
  agent1Name: string;
  agent2Name: string;
  agent1Track?: { storageUrl: string | null };
  agent2Track?: { storageUrl: string | null };
  agent1IsPlaying: boolean;
  agent2IsPlaying: boolean;
  onPlayAgent1: () => void;
  onPlayAgent2: () => void;
  currentRound: number;
};

export function AudioPlayerReplay({
  agent1Ref,
  agent2Ref,
  agent1Name,
  agent2Name,
  agent1Track,
  agent2Track,
  agent1IsPlaying,
  agent2IsPlaying,
  onPlayAgent1,
  onPlayAgent2,
  currentRound,
}: AudioPlayerReplayProps) {
  const hasAgent1Track = Boolean(agent1Track?.storageUrl);
  const hasAgent2Track = Boolean(agent2Track?.storageUrl);

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-tokyo-terminal/50 border-t bg-tokyo-bgDark/95 p-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-tokyo-terminal" />
            <div>
              <p className="font-medium text-sm text-tokyo-fg">
                Replay Mode - Round {currentRound}
              </p>
              <p className="text-[11px] text-tokyo-comment">
                Independent playback controls
              </p>
            </div>
          </div>
        </div>

        {/* Hidden audio elements */}
        <audio ref={agent1Ref}>
          <track kind="captions" />
        </audio>
        <audio ref={agent2Ref}>
          <track kind="captions" />
        </audio>

        <div className="flex gap-2">
          <Button
            className="group flex items-center gap-2 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-4 py-2 text-sm text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasAgent1Track}
            onClick={onPlayAgent1}
            type="button"
            variant="outline"
          >
            {agent1IsPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>
              {agent1IsPlaying ? "Pause" : "Play"} {agent1Name}
            </span>
          </Button>

          <Button
            className="group flex items-center gap-2 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 px-4 py-2 text-sm text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-magenta/60 hover:bg-tokyo-terminal hover:text-tokyo-magenta focus-visible:ring-2 focus-visible:ring-tokyo-magenta/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!hasAgent2Track}
            onClick={onPlayAgent2}
            type="button"
            variant="outline"
          >
            {agent2IsPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>
              {agent2IsPlaying ? "Pause" : "Play"} {agent2Name}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
