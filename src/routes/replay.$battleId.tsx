import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AudioPlayerReplay } from "@/components/battle/audio-player-replay";
import { BattleMainContent } from "@/components/battle/battle-main-content";
import { RoundSelector } from "@/components/battle/round-selector";
import { useBattleReplay } from "@/hooks/use-battle-replay";

export const Route = createFileRoute("/replay/$battleId")({
  component: BattleReplayView,
});

function BattleReplayView() {
  const { battleId } = Route.useParams();
  const navigate = useNavigate();

  const replayLogic = useBattleReplay(battleId);
  const {
    battle,
    currentUser,
    agent1Turn,
    agent2Turn,
    agent1Track,
    agent2Track,
    yourAgentName,
    selectedRound,
    setSelectedRound,
    maxCompletedRound,
  } = replayLogic;

  const agent1Ref = useRef<HTMLAudioElement>(null);
  const agent2Ref = useRef<HTMLAudioElement>(null);

  const [agent1IsPlaying, setAgent1IsPlaying] = useState(false);
  const [agent2IsPlaying, setAgent2IsPlaying] = useState(false);

  // Redirect if battle is not done
  useEffect(() => {
    if (battle && battle.state !== "done") {
      navigate({ to: "/battles/$battleId", params: { battleId } });
    }
  }, [battle, battleId, navigate]);

  // Update audio sources when tracks change
  useEffect(() => {
    if (agent1Ref.current && agent1Track?.storageUrl) {
      agent1Ref.current.src = agent1Track.storageUrl;
    }
  }, [agent1Track?.storageUrl]);

  useEffect(() => {
    if (agent2Ref.current && agent2Track?.storageUrl) {
      agent2Ref.current.src = agent2Track.storageUrl;
    }
  }, [agent2Track?.storageUrl]);

  const handlePlayAgent1 = () => {
    if (!agent1Ref.current) {
      return;
    }

    if (agent1IsPlaying) {
      agent1Ref.current.pause();
      setAgent1IsPlaying(false);
    } else {
      // Pause agent2 if playing
      if (agent2IsPlaying && agent2Ref.current) {
        agent2Ref.current.pause();
        setAgent2IsPlaying(false);
      }
      agent1Ref.current.play();
      setAgent1IsPlaying(true);
    }
  };

  const handlePlayAgent2 = () => {
    if (!agent2Ref.current) {
      return;
    }

    if (agent2IsPlaying) {
      agent2Ref.current.pause();
      setAgent2IsPlaying(false);
    } else {
      // Pause agent1 if playing
      if (agent1IsPlaying && agent1Ref.current) {
        agent1Ref.current.pause();
        setAgent1IsPlaying(false);
      }
      agent2Ref.current.play();
      setAgent2IsPlaying(true);
    }
  };

  // Handle audio ended events
  useEffect(() => {
    const agent1Element = agent1Ref.current;
    const agent2Element = agent2Ref.current;

    const handleAgent1Ended = () => {
      setAgent1IsPlaying(false);
    };
    const handleAgent2Ended = () => {
      setAgent2IsPlaying(false);
    };

    agent1Element?.addEventListener("ended", handleAgent1Ended);
    agent2Element?.addEventListener("ended", handleAgent2Ended);

    return () => {
      agent1Element?.removeEventListener("ended", handleAgent1Ended);
      agent2Element?.removeEventListener("ended", handleAgent2Ended);
    };
  }, []);

  if (!battle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading battle...</p>
      </div>
    );
  }

  // Only show replay for completed battles
  if (battle.state !== "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0d0d] p-6 pb-32">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 size-[600px] rounded-full bg-brand-coral opacity-10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 size-[600px] rounded-full bg-brand-coralLight opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <BattleMainContent
          agent1IsPlaying={agent1IsPlaying}
          agent1Turn={agent1Turn}
          agent2IsPlaying={agent2IsPlaying}
          agent2Turn={agent2Turn}
          battle={battle}
          currentTurn={null}
          currentUser={currentUser}
          isRappingPartner={false}
          isReplayMode={true}
          isYourTurn={false}
          yourAgentName={yourAgentName}
        />

        {/* Round Selector */}
        <RoundSelector
          maxRound={maxCompletedRound}
          onRoundChange={setSelectedRound}
          selectedRound={selectedRound}
        />

        {/* Replay Audio Player */}
        <AudioPlayerReplay
          agent1IsPlaying={agent1IsPlaying}
          agent1Name={battle.agent1Name}
          agent1Ref={agent1Ref}
          agent1Track={agent1Track}
          agent2IsPlaying={agent2IsPlaying}
          agent2Name={battle.agent2Name}
          agent2Ref={agent2Ref}
          agent2Track={agent2Track}
          currentRound={selectedRound}
          onPlayAgent1={handlePlayAgent1}
          onPlayAgent2={handlePlayAgent2}
        />
      </div>
    </div>
  );
}
