import { useEffect, useRef, useState } from "react";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const syncIntervalRef = useRef<number | null>(null);

  // Event listeners to track actual playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      console.log("[AudioSync] Audio started playing");
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log("[AudioSync] Audio paused");
      setIsPlaying(false);
    };

    const handlePlaying = () => {
      console.log("[AudioSync] Audio is playing");
      setIsPlaying(true);
    };

    const handleWaiting = () => {
      console.log("[AudioSync] Audio is buffering");
    };

    const handleCanPlay = () => {
      console.log("[AudioSync] Audio can play");
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioRef]);

  // Handle audio loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!(audio && trackUrl)) return;

    if (audio.src !== trackUrl) {
      console.log("[AudioSync] Loading new track:", trackUrl);
      audio.src = trackUrl;
      audio.load();
    }
  }, [audioRef, trackUrl]);

  // Handle playback and sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
            console.log(
              `[AudioSync] Re-syncing: drift=${drift.toFixed(2)}s, target=${targetPos.toFixed(2)}s`
            );
            audio.currentTime = targetPos;
          }

          if (audio.paused) {
            console.log("[AudioSync] Attempting to play audio");
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("[AudioSync] Playback started successfully");
                })
                .catch((error) => {
                  console.warn(
                    "[AudioSync] Autoplay prevented:",
                    error.message
                  );
                });
            }
          }
        } else if (positionSeconds >= durationSeconds) {
          console.log("[AudioSync] Track ended (based on server time)");
          audio.pause();
        }
      };

      // Initial sync
      syncAudio();

      // Set up periodic sync (every 500ms)
      syncIntervalRef.current = window.setInterval(syncAudio, 500);

      return () => {
        if (syncIntervalRef.current !== null) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      };
    }
    if (playbackState === "idle" || playbackState === "completed") {
      console.log("[AudioSync] Stopping playback");
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
    if (!audio) return;

    const handleEnded = () => {
      console.log("[AudioSync] Audio ended event fired");
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
