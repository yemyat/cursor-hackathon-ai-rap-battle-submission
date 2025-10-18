import { useEffect, useRef } from "react";

// Constants for sync thresholds
const MS_TO_SECONDS = 1000;
const SYNC_THRESHOLD_SECONDS = 1; // Only re-sync if more than 1 second off

type AudioSyncProps = {
  audioRef: React.RefObject<HTMLAudioElement>;
  playbackStartedAt?: number;
  playbackDuration?: number;
  playbackState?: "idle" | "playing" | "completed";
  trackUrl?: string;
  onEnded?: () => void;
};

/**
 * AudioSync component handles server-synchronized audio playback.
 * 
 * It calculates the current playback position based on server timestamps
 * to ensure all clients are hearing the same audio at the same time,
 * similar to a Kahoot-like synchronized experience.
 */
export function AudioSync({
  audioRef,
  playbackStartedAt,
  playbackDuration,
  playbackState,
  trackUrl,
  onEnded,
}: AudioSyncProps) {
  const hasTriedPlayRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackUrl) {
      return;
    }

    // Load the audio file if it changed
    if (audio.src !== trackUrl) {
      audio.src = trackUrl;
      audio.load();
      hasTriedPlayRef.current = false;
    }

    // Handle playback state changes
    if (playbackState === "playing" && playbackStartedAt && playbackDuration) {
      // Calculate current position based on server timestamp
      const serverTime = playbackStartedAt;
      const now = Date.now();
      const elapsedMs = now - serverTime;
      const positionSeconds = elapsedMs / MS_TO_SECONDS;

      // Only sync if we're within the track duration
      if (positionSeconds >= 0 && positionSeconds < playbackDuration / MS_TO_SECONDS) {
        // Sync audio position with server time
        const currentPos = audio.currentTime;
        const targetPos = positionSeconds;
        
        // Only seek if we're more than threshold off (to avoid constant micro-adjustments)
        if (Math.abs(currentPos - targetPos) > SYNC_THRESHOLD_SECONDS && !hasTriedPlayRef.current) {
          audio.currentTime = targetPos;
        }

        // Try to play if paused
        if (audio.paused) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Autoplay was prevented - user needs to interact first
              // Silent fail - this is expected behavior
            });
          }
          hasTriedPlayRef.current = true;
        }
      } else if (positionSeconds >= playbackDuration / MS_TO_SECONDS) {
        // Track should have ended
        audio.pause();
      }
    } else if (playbackState === "idle" || playbackState === "completed") {
      // Stop playback
      if (!audio.paused) {
        audio.pause();
      }
      hasTriedPlayRef.current = false;
    }
  }, [
    audioRef,
    playbackStartedAt,
    playbackDuration,
    playbackState,
    trackUrl,
  ]);

  // Handle audio ended event
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, onEnded]);

  return null; // This is a logic-only component
}
