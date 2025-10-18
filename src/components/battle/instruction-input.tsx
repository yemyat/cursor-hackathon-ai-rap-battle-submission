import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_CHARS = 500;
const TIMER_UPDATE_INTERVAL_MS = 100;
const MS_TO_SECONDS = 1000;
const URGENT_THRESHOLD_SECONDS = 3;

type InstructionInputProps = {
  battleId: Id<"rapBattles">;
  isYourTurn: boolean;
  agentName: string;
};

export function InstructionInput({
  battleId,
  isYourTurn,
  agentName,
}: InstructionInputProps) {
  const [instructions, setInstructions] = useState("");
  const submitInstructions = useMutation(api.rapBattle.submitInstructions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnInfo = useQuery(api.rapBattle.getCurrentTurnInfo, { battleId });
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!(turnInfo?.currentTurnDeadline && isYourTurn)) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, turnInfo.currentTurnDeadline - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, TIMER_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [turnInfo?.currentTurnDeadline, isYourTurn]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await submitInstructions({
        battleId,
        instructions: instructions.trim(),
      });
      setInstructions("");
      toast.success("Instructions submitted! Agent is generating...");
    } catch {
      toast.error("Failed to submit instructions. Please try again.");
    }
    setIsSubmitting(false);
  }, [isSubmitting, submitInstructions, battleId, instructions]);

  // Hide input if not your turn OR if deadline has passed
  const deadlinePassed = turnInfo?.currentTurnDeadline
    ? Date.now() > turnInfo.currentTurnDeadline
    : false;

  if (!isYourTurn || deadlinePassed) {
    return (
      <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
        <CardContent className="py-8 text-center">
          <p className="text-lg text-white/70">
            Waiting for opponent's instructions...
          </p>
        </CardContent>
      </Card>
    );
  }

  const secondsLeft = Math.ceil(timeLeft / MS_TO_SECONDS);

  return (
    <Card className="border-brand-coral/50 bg-brand-coral/10 ring-2 ring-brand-coral/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl text-white">
          <span>
            Instruct <span className="text-brand-coral">{agentName}</span>
          </span>
          {isYourTurn && timeLeft > 0 && (
            <span
              className={`font-bold font-mono text-xl ${
                secondsLeft <= URGENT_THRESHOLD_SECONDS
                  ? "animate-pulse text-red-400"
                  : "text-brand-coralLight"
              }`}
            >
              {secondsLeft}s
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          className="min-h-[120px] border-zinc-700 bg-zinc-900/80 text-base text-white placeholder:text-white/50 focus:border-brand-coral focus:ring-brand-coral/50"
          disabled={isSubmitting}
          maxLength={MAX_CHARS}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Tell your agent what to rap about, what to diss, or what style to use... Be quick!"
          value={instructions}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">
            {instructions.length}/{MAX_CHARS}
          </span>
          <Button
            className="h-11 border-0 bg-brand-coral px-8 font-semibold text-white transition-all hover:bg-brand-coralDark"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
