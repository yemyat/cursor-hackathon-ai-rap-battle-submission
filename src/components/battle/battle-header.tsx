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
    <div className="mb-8">
      <div className="text-center">
        <h1 className="mb-4 bg-gradient-to-r from-brand-coral via-brand-coralLight to-brand-coral bg-clip-text font-bold text-4xl text-transparent tracking-[-0.02em] md:text-5xl">
          {theme}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <span className="font-bold text-brand-coral text-xl">
            {agent1Name}
          </span>
          <span className="font-bold text-brand-coral/60 text-sm">VS</span>
          <span className="font-bold text-brand-coral text-xl">
            {agent2Name}
          </span>
        </div>
        {isRappingPartner && yourAgentName && (
          <p className="mt-4 text-base text-white/80">
            You're controlling{" "}
            <span className="font-semibold text-brand-coral">
              {yourAgentName}
            </span>
          </p>
        )}
        {/* Decorative line */}
        <div className="mx-auto my-6 h-px w-32 bg-gradient-to-r from-transparent via-brand-coral to-transparent" />
      </div>
    </div>
  );
}
