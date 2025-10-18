import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useBattleReplay(battleId: string) {
  const battle = useQuery(api.rapBattle.getBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const currentUser = useQuery(api.users.getCurrentUser);

  const turns = useQuery(api.rapBattle.getTurnsByBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  // Local state for round selection in replay mode
  const [selectedRound, setSelectedRound] = useState(1);

  // Get turns for the selected round
  const roundTurns =
    turns?.filter((t) => t.roundNumber === selectedRound) ?? [];
  const agent1Turn = roundTurns.find((t) => t.agentName === battle?.agent1Name);
  const agent2Turn = roundTurns.find((t) => t.agentName === battle?.agent2Name);

  // Get music tracks for current round
  const agent1Track = useQuery(
    api.rapBattle.getMusicTrack,
    agent1Turn?.musicTrackId ? { trackId: agent1Turn.musicTrackId } : "skip"
  );
  const agent2Track = useQuery(
    api.rapBattle.getMusicTrack,
    agent2Turn?.musicTrackId ? { trackId: agent2Turn.musicTrackId } : "skip"
  );

  // Determine user role
  const isPartner1 = currentUser && battle?.partner1UserId === currentUser._id;
  const isPartner2 = currentUser && battle?.partner2UserId === currentUser._id;
  const isRappingPartner = isPartner1 || isPartner2;

  // Determine which agent the current user controls
  let yourAgentName: string | undefined;
  if (isPartner1) {
    yourAgentName = battle?.partner1Side;
  } else if (isPartner2) {
    yourAgentName = battle?.partner2Side;
  }

  // Calculate max completed round
  const maxCompletedRound = turns
    ? Math.max(...turns.map((t) => t.roundNumber))
    : 1;

  return {
    battle,
    currentUser,
    turns,
    selectedRound,
    setSelectedRound,
    maxCompletedRound,
    roundTurns,
    agent1Turn,
    agent2Turn,
    agent1Track,
    agent2Track,
    isPartner1,
    isPartner2,
    isRappingPartner,
    yourAgentName,
  };
}
