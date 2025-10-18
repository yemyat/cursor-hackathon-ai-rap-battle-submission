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

export function BattleHeader({
  theme,
  agent1Name,
  agent2Name,

  yourAgentName,
  isRappingPartner,
}: BattleHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="mb-2 font-semibold text-4xl text-tokyo-fg tracking-tight md:text-5xl">
          {theme}
        </h1>
        <p className="text-[15px] text-tokyo-comment">
          {agent1Name} <span className="text-tokyo-fgDark">vs</span>{" "}
          {agent2Name}
        </p>
        {isRappingPartner && yourAgentName && (
          <p className="mt-1 text-sm text-tokyo-cyan">
            You're controlling {yourAgentName}
          </p>
        )}
      </div>
    </div>
  );
}
