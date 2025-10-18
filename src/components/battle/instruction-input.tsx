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
      <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
        <CardContent className="py-8 text-center">
          <p className="text-tokyo-comment">
            Waiting for opponent's instructions...
          </p>
        </CardContent>
      </Card>
    );
  }

  const secondsLeft = Math.ceil(timeLeft / MS_TO_SECONDS);

  return (
    <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-tokyo-fg text-xl">
          <span>Instruct {agentName}</span>
          {isYourTurn && timeLeft > 0 && (
            <span
              className={`font-mono text-lg ${
                secondsLeft <= URGENT_THRESHOLD_SECONDS
                  ? "animate-pulse text-tokyo-red"
                  : "text-tokyo-orange"
              }`}
            >
              {secondsLeft}s
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          className="min-h-[120px] border-tokyo-terminal/80 bg-tokyo-bgDark/80 text-tokyo-fg placeholder:text-tokyo-comment focus:border-tokyo-blue focus:ring-tokyo-blue/50"
          disabled={isSubmitting}
          maxLength={MAX_CHARS}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Tell your agent what to rap about, what to diss, or what style to use... Be quick!"
          value={instructions}
        />
        <div className="flex items-center justify-between">
          <span className="text-tokyo-comment text-xs">
            {instructions.length}/{MAX_CHARS}
          </span>
          <Button
            className="border-tokyo-blue/60 bg-tokyo-blue/10 text-tokyo-blue hover:bg-tokyo-blue/20"
            disabled={isSubmitting}
            onClick={handleSubmit}
            variant="outline"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
