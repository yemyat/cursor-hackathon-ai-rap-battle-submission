import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_CHARS = 500;

type InstructionInputProps = {
  battleId: Id<"rapBattles">;
  isYourTurn: boolean;
  deadline: number | undefined;
  agentName: string;
};

export function InstructionInput({
  battleId,
  isYourTurn,
  deadline,
  agentName,
}: InstructionInputProps) {
  const [instructions, setInstructions] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const submitInstructions = useMutation(api.rapBattle.submitInstructions);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update time remaining every 100ms
  useEffect(() => {
    if (!deadline) {
      setTimeRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeRemaining(remaining);

      // Auto-submit when time runs out
      if (remaining === 0 && isYourTurn && !isSubmitting) {
        handleSubmit();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deadline, isYourTurn, isSubmitting]);

  const handleSubmit = async () => {
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
    } catch (error) {
      console.error("Failed to submit instructions:", error);
    }
    setIsSubmitting(false);
  };

  const seconds = Math.ceil(timeRemaining / 1000);
  const isLowTime = seconds <= 3 && seconds > 0;

  if (!isYourTurn) {
    return (
      <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
        <CardContent className="py-8 text-center">
          <p className="text-tokyo-comment">Waiting for opponent's instructions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-tokyo-fg text-xl">
            Instruct {agentName}
          </span>
          <span
            className={`font-mono text-2xl tabular-nums transition-colors ${
              isLowTime ? "text-red-500 animate-pulse" : "text-tokyo-cyan"
            }`}
          >
            {seconds}s
          </span>
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
          <span className="text-xs text-tokyo-comment">
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

