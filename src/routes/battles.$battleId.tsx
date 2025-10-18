import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useRef } from "react";
import { AudioPlayer } from "@/components/battle/audio-player";
import { AudioSync } from "@/components/battle/audio-sync";
import { BattleHeader } from "@/components/battle/battle-header";
import { BattleStatus } from "@/components/battle/battle-status";
import { CheerDisplay } from "@/components/battle/cheer-display";
import { InstructionInput } from "@/components/battle/instruction-input";
import { TurnCard } from "@/components/battle/turn-card";
import { WaitingForPartner } from "@/components/battle/waiting-for-partner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/battles/$battleId")({
  component: BattleView,
});

function BattleView() {
  const { battleId } = Route.useParams();
  const battle = useQuery(api.rapBattle.getBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const currentUser = useQuery(api.users.getCurrentUser);

  const turns = useQuery(api.rapBattle.getTurnsByBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const currentTurnInfo = useQuery(api.rapBattle.getCurrentTurnInfo, {
    battleId: battleId as Id<"rapBattles">,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  const joinBattle = useMutation(api.rapBattle.joinBattle);

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

      <div className="mb-10">
        <BattleHeader
          agent1Name={battle.agent1Name}
          agent2Name={battle.agent2Name}
          battleState={battle.state}
          currentRound={battle.currentRound}
          isRappingPartner={Boolean(isRappingPartner)}
          maxRounds={3}
          theme={battle.theme}
          yourAgentName={yourAgentName ?? undefined}
        />

        {/* Battle Status Indicator */}
        <div className="mb-6">
          <BattleStatus
            agent1Name={battle.agent1Name}
            agent2Name={battle.agent2Name}
            battleState={battle.state}
            currentlyPlayingAgentName={currentTurn?.agentName ?? undefined}
            currentRound={battle.currentRound}
            currentTurnUserId={battle.currentTurnUserId}
            currentUserId={currentUser?._id}
            partner1UserId={battle.partner1UserId}
            playbackState={battle.playbackState}
          />
        </div>

        {/* Instruction Input (only visible to rapping partners) */}
        {isRappingPartner && battle.state === "in_progress" && (
          <div className="mb-6">
            <InstructionInput
              agentName={yourAgentName ?? ""}
              battleId={battle._id}
              deadline={currentTurnInfo?.currentTurnDeadline}
              isYourTurn={isYourTurn ?? false}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-6">
            {/* Agent 1 */}
            <div className="space-y-5">
              <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-tokyo-blue shadow-[0_0_8px_rgba(122,162,247,0.6)]" />
                    <CardTitle className="text-center font-semibold text-tokyo-fg text-xl tracking-tight">
                      {battle.agent1Name}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>

              {agent1Turn ? (
                <TurnCard
                  agentColor="blue"
                  isPlaying={currentlyPlayingTurn === agent1Turn._id}
                  turn={agent1Turn}
                />
              ) : (
                <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
                  <CardContent className="py-16 text-center">
                    <div className="relative inline-block">
                      <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
                      <p className="text-tokyo-comment">Waiting for verse...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Agent 2 */}
            <div className="space-y-5">
              <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-magenta/10 backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-tokyo-magenta shadow-[0_0_8px_rgba(187,154,247,0.6)]" />
                    <CardTitle className="text-center font-semibold text-tokyo-fg text-xl tracking-tight">
                      {battle.agent2Name}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>

              {agent2Turn ? (
                <TurnCard
                  agentColor="magenta"
                  isPlaying={currentlyPlayingTurn === agent2Turn._id}
                  turn={agent2Turn}
                />
              ) : (
                <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-magenta/10 backdrop-blur-xl">
                  <CardContent className="py-16 text-center">
                    <div className="relative inline-block">
                      <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />
                      <p className="text-tokyo-comment">Waiting for verse...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Cheer Display */}
        <div className="lg:col-span-1">
          <CheerDisplay battleId={battle._id} />
        </div>
      </div>

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
