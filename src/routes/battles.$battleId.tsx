import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useRef } from "react";
import { AudioPlayer } from "@/components/battle/audio-player";
import { AudioSync } from "@/components/battle/audio-sync";
import { BattleMainContent } from "@/components/battle/battle-main-content";
import { WaitingForPartner } from "@/components/battle/waiting-for-partner";
import { useBattleLogic } from "@/hooks/use-battle-logic";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/$battleId")({
  component: BattleView,
});

function BattleView() {
  const { battleId } = Route.useParams();

  const battleLogic = useBattleLogic(battleId);
  const {
    battle,
    currentUser,
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
  } = battleLogic;

  const audioRef = useRef<HTMLAudioElement>(null);
  const joinBattle = useMutation(api.rapBattle.joinBattle);

  if (!battle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading battle...</p>
      </div>
    );
  }

  // Waiting for partner state
  if (battle.state === "waiting_for_partner") {
    const canJoin = currentUser && !isPartner1 && !isPartner2;

    return (
      <WaitingForPartner
        battleId={battle._id}
        canJoin={Boolean(canJoin)}
        onJoin={async () => {
          await joinBattle({
            battleId: battle._id as Id<"rapBattles">,
          });
        }}
        partner1Side={battle.partner1Side}
        partner2Side={battle.partner2Side ?? "Unknown"}
        theme={battle.theme}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 p-6 pb-32">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      {/* Hidden audio element controlled by AudioSync */}
      <audio ref={audioRef}>
        <track kind="captions" />
      </audio>

      {/* AudioSync handles server-synchronized playback */}
      <AudioSync
        audioRef={audioRef}
        playbackDuration={battle.playbackDuration}
        playbackStartedAt={battle.playbackStartedAt}
        playbackState={battle.playbackState}
        trackUrl={currentTrack?.storageUrl ?? undefined}
      />

      <BattleMainContent
        agent1IsPlaying={agent1IsPlaying}
        agent1Turn={agent1Turn}
        agent2IsPlaying={agent2IsPlaying}
        agent2Turn={agent2Turn}
        battle={battle}
        currentTurn={currentTurn ?? null}
        currentUser={currentUser}
        isRappingPartner={Boolean(isRappingPartner)}
        isYourTurn={Boolean(isYourTurn)}
        yourAgentName={yourAgentName}
      />

      {/* Audio Player - Display Only (controlled by workflow) */}
      <AudioPlayer
        agent1Name={battle.agent1Name}
        agent1Turn={agent1Turn}
        agent2Name={battle.agent2Name}
        agent2Turn={agent2Turn}
        audioRef={audioRef}
        battleId={battle._id}
        currentTurn={currentTurn ?? null}
        hasAgent1Track={agent1Track !== undefined}
        hasAgent2Track={agent2Track !== undefined}
        isCheerleader={isCheerleader ?? false}
        onAudioEnded={() => {
          // Workflow handles progression automatically
        }}
        onAudioPause={() => {
          // Workflow controls playback
        }}
        onAudioPlay={() => {
          // Workflow controls playback
        }}
        onPlayAgent1={undefined}
        onPlayAgent2={undefined}
      />
    </div>
  );
}
