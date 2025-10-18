import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Id } from "../../../convex/_generated/dataModel";

type WaitingForPartnerProps = {
  theme: string;
  partner1Side: string;
  partner2Side: string;
  canJoin: boolean;
  battleId: Id<"rapBattles">;
  onJoin: () => Promise<void>;
};

export function WaitingForPartner({
  theme,
  partner1Side,
  partner2Side,
  canJoin,
  onJoin,
}: WaitingForPartnerProps) {
  return (
    <div className="relative min-h-screen bg-zinc-950 p-6">
      <div className="mesh-hero -z-10 animate-mesh-pan" />

      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="mb-2 font-semibold text-4xl text-tokyo-fg tracking-tight md:text-5xl">
            {theme}
          </h1>
          <p className="text-[15px] text-tokyo-comment">
            {partner1Side} vs {partner2Side}
          </p>
        </div>

        <Card className="mesh-card border-tokyo-terminal/50 bg-tokyo-terminal/30 ring-1 ring-tokyo-blue/10 backdrop-blur-xl">
          <CardContent className="py-16 text-center">
            <div className="relative inline-block">
              <div className="mesh-spot -z-10 absolute inset-0 opacity-50" />

              {canJoin ? (
                <>
                  <div className="mb-4 text-4xl">🎤</div>
                  <p className="mb-2 font-semibold text-tokyo-fg text-xl">
                    Join the Battle!
                  </p>
                  <p className="mb-6 text-sm text-tokyo-comment">
                    Ready to drop some bars?
                  </p>
                  <Button
                    className="border-tokyo-magenta/60 bg-tokyo-magenta/10 text-tokyo-magenta hover:bg-tokyo-magenta/20"
                    onClick={async () => {
                      try {
                        await onJoin();
                        toast.success("You've joined the battle! Get ready!");
                      } catch {
                        toast.error("Failed to join battle. Please try again.");
                      }
                    }}
                    variant="outline"
                  >
                    Join as {partner2Side}
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4 text-4xl">⏳</div>
                  <p className="mb-2 font-semibold text-tokyo-fg text-xl">
                    Waiting for opponent...
                  </p>
                  <p className="mb-2 text-sm text-tokyo-comment">
                    You're playing as {partner1Side}
                  </p>
                  <p className="text-sm text-tokyo-comment">
                    Share this battle link with someone to start!
                  </p>
                  <Button
                    className="mt-4 border-tokyo-blue/60 bg-tokyo-blue/10 text-tokyo-blue hover:bg-tokyo-blue/20"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(window.location.href)
                        .then(() => {
                          toast.success("Battle link copied to clipboard!");
                        })
                        .catch(() => {
                          toast.error("Failed to copy link");
                        });
                    }}
                    variant="outline"
                  >
                    Copy Battle Link
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
