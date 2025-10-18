import { Badge } from "@/components/ui/badge";

type BattleHeaderProps = {
  theme: string;
  agent1Name: string;
  agent2Name: string;
  currentRound: number;
  maxRounds: number;
  battleState: "waiting_for_partner" | "preparing" | "in_progress" | "done";
  yourAgentName?: string;
  isRappingPartner: boolean;
};

const STATE_STYLES = {
  done: "border-tokyo-green/60 bg-tokyo-green/10 text-tokyo-green",
  in_progress: "border-tokyo-magenta/60 bg-tokyo-magenta/10 text-tokyo-magenta",
  preparing: "border-tokyo-cyan/60 bg-tokyo-cyan/10 text-tokyo-cyan",
  waiting_for_partner: "border-tokyo-cyan/60 bg-tokyo-cyan/10 text-tokyo-cyan",
};

const STATE_LABELS = {
  done: "Complete",
  in_progress: "In Progress",
  preparing: "Preparing",
  waiting_for_partner: "Waiting",
};

export function BattleHeader({
  theme,
  agent1Name,
  agent2Name,
  currentRound,
  maxRounds,
  battleState,
  yourAgentName,
  isRappingPartner,
}: BattleHeaderProps) {
  const stateStyle = STATE_STYLES[battleState] || STATE_STYLES.preparing;
  const stateLabel = STATE_LABELS[battleState] || STATE_LABELS.preparing;

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="mb-2 font-semibold text-4xl text-tokyo-fg tracking-tight md:text-5xl">
          {theme}
        </h1>
        <p className="text-[15px] text-tokyo-comment">
          {agent1Name} <span className="text-tokyo-fgDark">vs</span> {agent2Name}
        </p>
        {isRappingPartner && yourAgentName && (
          <p className="mt-1 text-sm text-tokyo-cyan">
            You're controlling {yourAgentName}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <Badge
          className="rounded-md border-tokyo-terminal/80 bg-tokyo-terminal/60 px-3 py-1.5 font-medium text-sm text-tokyo-fgDark backdrop-blur-sm"
          variant="outline"
        >
          Round {currentRound}/{maxRounds}
        </Badge>
        <Badge
          className={`rounded-md px-3 py-1.5 font-medium text-sm backdrop-blur-sm ${stateStyle}`}
          variant="outline"
        >
          {stateLabel}
        </Badge>
      </div>
    </div>
  );
}
