import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/battle/audio-player";
import { TurnCard } from "@/components/battle/turn-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const turns = useQuery(api.rapBattle.getTurnsByBattle, {
    battleId: battleId as Id<"rapBattles">,
  });

  const [selectedRound, setSelectedRound] = useState(1);
  const [currentlyPlayingTurn, setCurrentlyPlayingTurn] =
    useState<Id<"turns"> | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Audio event handlers
  const handleAudioEnded = () => {
    if (currentlyPlayingTurn === agent1Turn?._id && agent2Turn) {
      // Agent1 finished, play agent2
      setCurrentlyPlayingTurn(agent2Turn._id);
    } else if (
      currentlyPlayingTurn === agent2Turn?._id &&
      selectedRound < maxRound
    ) {
      // Agent2 finished, advance to next round
      setSelectedRound(selectedRound + 1);
    } else {
      // No more to play
      setCurrentlyPlayingTurn(null);
    }
  };

  const handleAudioPlay = () => {
    // Audio play is managed through currentlyPlayingTurn state
  };

  const handleAudioPause = () => {
    setCurrentlyPlayingTurn(null);
  };

  // Effect to load and play audio when currentlyPlayingTurn changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (currentlyPlayingTurn && currentTrack?.storageUrl) {
      audio.src = currentTrack.storageUrl;
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Audio play failed - user interaction may be required
        });
      }
    } else {
      audio.pause();
    }
  }, [currentlyPlayingTurn, currentTrack?.storageUrl]);

  // Reset playing state when round changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally want this to run only when selectedRound changes
  useEffect(() => {
    setCurrentlyPlayingTurn(null);
  }, [selectedRound]);

  // Autoplay agent1 when round is ready (only after user has interacted)
  useEffect(() => {
    if (
      hasUserInteracted &&
      agent1Turn &&
      agent1Track &&
      !currentlyPlayingTurn
    ) {
      setCurrentlyPlayingTurn(agent1Turn._id);
    }
  }, [hasUserInteracted, agent1Turn, agent1Track, currentlyPlayingTurn]);

  if (!battle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading battle...</p>
      </div>
    );
  }

  // Calculate total rounds that have at least one turn
  const maxRound = Math.max(...(turns?.map((t) => t.roundNumber) ?? [1]), 1);

  // Determine battle state styling
  const getStateStyle = () => {
    if (battle.state === "done") {
      return "border-tokyo-green/60 bg-tokyo-green/10 text-tokyo-green";
    }
    if (battle.state === "in_progress") {
      return "border-tokyo-magenta/60 bg-tokyo-magenta/10 text-tokyo-magenta";
    }
    return "border-tokyo-cyan/60 bg-tokyo-cyan/10 text-tokyo-cyan";
  };

  const getStateLabel = () => {
    if (battle.state === "done") {
      return "Complete";
    }
    if (battle.state === "in_progress") {
      return "In Progress";
    }
    return "Preparing";
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 p-6 pb-32">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mb-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-semibold text-4xl text-tokyo-fg tracking-tight md:text-5xl">
              {battle.theme}
            </h1>
            <p className="text-[15px] text-tokyo-comment">
              {battle.agent1Name} <span className="text-tokyo-fgDark">vs</span>{" "}
              {battle.agent2Name}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Badge
              className="rounded-md border-tokyo-terminal/80 bg-tokyo-terminal/60 px-3 py-1.5 font-medium text-sm text-tokyo-fgDark backdrop-blur-sm"
              variant="outline"
            >
              Round {battle.currentRound}/3
            </Badge>
            <Badge
              className={`rounded-md px-3 py-1.5 font-medium text-sm backdrop-blur-sm ${getStateStyle()}`}
              variant="outline"
            >
              {getStateLabel()}
            </Badge>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            className="h-9 w-9 rounded-lg border-tokyo-terminal/80 bg-tokyo-terminal/60 text-tokyo-fgDark backdrop-blur-sm transition-all duration-200 hover:border-tokyo-blue/60 hover:bg-tokyo-terminal hover:text-tokyo-blue focus-visible:ring-2 focus-visible:ring-tokyo-blue/50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedRound === 1}
            onClick={() => setSelectedRound(Math.max(1, selectedRound - 1))}
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
            onClick={() =>
              setSelectedRound(Math.min(maxRound, selectedRound + 1))
            }
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
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

      <AudioPlayer
        agent1Name={battle.agent1Name}
        agent1Turn={agent1Turn}
        agent2Name={battle.agent2Name}
        agent2Turn={agent2Turn}
        audioRef={audioRef}
        currentTurn={currentTurn ?? null}
        hasAgent1Track={agent1Track !== undefined}
        hasAgent2Track={agent2Track !== undefined}
        onAudioEnded={handleAudioEnded}
        onAudioPause={handleAudioPause}
        onAudioPlay={handleAudioPlay}
        onPlayAgent1={() => {
          if (agent1Turn) {
            setHasUserInteracted(true);
            setCurrentlyPlayingTurn(agent1Turn._id);
          }
        }}
        onPlayAgent2={() => {
          if (agent2Turn) {
            setHasUserInteracted(true);
            setCurrentlyPlayingTurn(agent2Turn._id);
          }
        }}
      />
    </div>
  );
}
