import { QRCodeSVG } from "qrcode.react";
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
    <div className="relative min-h-screen overflow-hidden bg-[#0d0d0d] p-6">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 size-[600px] rounded-full bg-brand-coral opacity-10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 size-[600px] rounded-full bg-brand-coralLight opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <h1 className="mb-4 bg-gradient-to-r from-brand-coral via-brand-coralLight to-brand-coral bg-clip-text font-bold text-5xl text-transparent tracking-[-0.02em] md:text-6xl">
            {theme}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="font-bold text-2xl text-brand-coral">
              {partner1Side}
            </span>
            <span className="font-bold text-brand-coral/60 text-sm">VS</span>
            <span className="font-bold text-2xl text-brand-coral">
              {partner2Side}
            </span>
          </div>
          {/* Decorative line */}
          <div className="mx-auto my-8 h-px w-32 bg-gradient-to-r from-transparent via-brand-coral to-transparent" />
        </div>

        <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="py-16 text-center">
            {canJoin ? (
              <>
                <div className="mb-6 text-6xl">🎤</div>
                <p className="mb-3 font-bold text-3xl text-white">
                  Join the Battle!
                </p>
                <p className="mb-8 text-lg text-white/70">
                  Ready to drop some bars?
                </p>
                <Button
                  className="h-14 border-0 bg-brand-coral px-12 font-bold text-white text-xl shadow-brand-coral/30 shadow-lg transition-all hover:bg-brand-coralDark hover:shadow-brand-coral/40 hover:shadow-xl"
                  onClick={async () => {
                    try {
                      await onJoin();
                      toast.success("You've joined the battle! Get ready!");
                    } catch {
                      toast.error("Failed to join battle. Please try again.");
                    }
                  }}
                  size="lg"
                >
                  Join as {partner2Side}
                </Button>
              </>
            ) : (
              <>
                <div className="mb-6 text-6xl">⏳</div>
                <p className="mb-3 font-bold text-3xl text-white">
                  Waiting for opponent...
                </p>
                <p className="mb-2 text-lg text-white/70">
                  You're playing as {partner1Side}
                </p>
                <p className="mb-6 text-base text-white/60">
                  Share this battle link with someone to start!
                </p>
                <div className="mb-8 flex justify-center">
                  <div className="rounded-lg bg-white p-4">
                    <QRCodeSVG size={200} value={window.location.href} />
                  </div>
                </div>
                <Button
                  className="h-12 border-2 border-brand-coral/60 bg-brand-coral/10 px-8 font-semibold text-brand-coral transition-all hover:bg-brand-coral/20"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
