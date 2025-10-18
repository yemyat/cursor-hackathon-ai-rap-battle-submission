import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_CHARS = 500;

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

  if (!isYourTurn) {
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

  return (
    <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-tokyo-fg text-xl">
          Instruct {agentName}
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
