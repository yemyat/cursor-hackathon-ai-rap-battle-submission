import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useBattleLogic(battleId: string) {
  const battle = useQuery(api.rapBattle.getBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const currentUser = useQuery(api.users.getCurrentUser);

  const turns = useQuery(api.rapBattle.getTurnsByBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  // Use Convex-controlled state from workflow
  const selectedRound = battle?.currentRound ?? 1;
  const currentlyPlayingTurn = battle?.currentlyPlayingTurnId ?? null;

  // Get turns for the selected round
  const roundTurns =
    turns?.filter((t) => t.roundNumber === selectedRound) ?? [];
  const agent1Turn = roundTurns.find((t) => t.agentName === battle?.agent1Name);
  const agent2Turn = roundTurns.find((t) => t.agentName === battle?.agent2Name);

  // Get music tracks for current round
  const agent1Track = useQuery(
    api.rapBattle.getMusicTrack,
    agent1Turn ? { trackId: agent1Turn.musicTrackId } : "skip"
  );
  const agent2Track = useQuery(
    api.rapBattle.getMusicTrack,
    agent2Turn ? { trackId: agent2Turn.musicTrackId } : "skip"
  );

  // Get currently playing track info
  const currentTurn = currentlyPlayingTurn
    ? turns?.find((t) => t._id === currentlyPlayingTurn)
    : null;
  const currentTrack = useQuery(
    api.rapBattle.getMusicTrack,
    currentTurn ? { trackId: currentTurn.musicTrackId } : "skip"
  );

  // Determine user role
  const isPartner1 = currentUser && battle?.partner1UserId === currentUser._id;
  const isPartner2 = currentUser && battle?.partner2UserId === currentUser._id;
  const isRappingPartner = isPartner1 || isPartner2;
  const isCheerleader = currentUser && !isRappingPartner;
  const isYourTurn =
    currentUser && battle?.currentTurnUserId === currentUser._id;

  // Determine which agent the current user controls
  let yourAgentName: string | undefined;
  if (isPartner1) {
    yourAgentName = battle?.partner1Side;
  } else if (isPartner2) {
    yourAgentName = battle?.partner2Side;
  }

  // Determine which agents are currently playing
  const agent1IsPlaying = currentlyPlayingTurn === agent1Turn?._id;
  const agent2IsPlaying = currentlyPlayingTurn === agent2Turn?._id;

  return {
    battle,
    currentUser,
    turns,
    selectedRound,
    currentlyPlayingTurn,
    roundTurns,
    agent1Turn,
    agent2Turn,
    agent1Track,
    agent2Track,
    currentTurn,
    currentTrack,
    isPartner1,
    isPartner2,
    isRappingPartner,
    isCheerleader,
    isYourTurn,
    yourAgentName,
    agent1IsPlaying,
    agent2IsPlaying,
  };
}
