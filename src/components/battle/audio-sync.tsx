import { useEffect, useRef } from "react";

// Constants for sync thresholds
const MS_TO_SECONDS = 1000;
const SYNC_THRESHOLD_SECONDS = 1;
const SYNC_INTERVAL_MS = 500;

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
  const syncIntervalRef = useRef<number | null>(null);

  // Handle audio loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!(audio && trackUrl)) {
      return;
    }

    if (audio.src !== trackUrl) {
      audio.src = trackUrl;
      audio.load();
    }
  }, [audioRef, trackUrl]);

  // Handle playback and sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playbackState === "playing" && playbackStartedAt && playbackDuration) {
      const syncAudio = () => {
        const now = Date.now();
        const elapsedMs = now - playbackStartedAt;
        const positionSeconds = elapsedMs / MS_TO_SECONDS;
        const durationSeconds = playbackDuration / MS_TO_SECONDS;

        if (positionSeconds >= 0 && positionSeconds < durationSeconds) {
          const currentPos = audio.currentTime;
          const targetPos = positionSeconds;
          const drift = Math.abs(currentPos - targetPos);

          if (drift > SYNC_THRESHOLD_SECONDS) {
            audio.currentTime = targetPos;
          }

          if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch((e) => {
                // biome-ignore lint/suspicious/noConsole: <helpful>
                console.error(e);
              });
            }
          }
        } else if (positionSeconds >= durationSeconds) {
          audio.pause();
        }
      };

      syncAudio();
      syncIntervalRef.current = window.setInterval(syncAudio, SYNC_INTERVAL_MS);

      return () => {
        if (syncIntervalRef.current !== null) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      };
    }
    if (playbackState === "idle" || playbackState === "completed") {
      if (!audio.paused) {
        audio.pause();
      }
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    }
  }, [audioRef, playbackStartedAt, playbackDuration, playbackState]);

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

  return null;
}
