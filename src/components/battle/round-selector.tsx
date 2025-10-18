import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type RoundSelectorProps = {
  selectedRound: number;
  maxRound: number;
  onRoundChange: (round: number) => void;
};

export function RoundSelector({
  selectedRound,
  maxRound,
  onRoundChange,
}: RoundSelectorProps) {
  if (maxRound <= 0) {
    return null;
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <Button
        className="h-9 w-9 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={selectedRound === 1}
        onClick={() => onRoundChange(Math.max(1, selectedRound - 1))}
        size="icon"
        variant="outline"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="rounded-lg border border-tokyo-terminal/80 bg-tokyo-bgDark/80 px-5 py-2 backdrop-blur-sm">
        <span className="font-medium text-[13px] text-tokyo-fgDark tracking-wide">
          Round {selectedRound} of {maxRound}
        </span>
      </div>
      <Button
        className="h-9 w-9 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={selectedRound === maxRound}
        onClick={() => onRoundChange(Math.min(maxRound, selectedRound + 1))}
        size="icon"
        variant="outline"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
