import { fal } from "@fal-ai/client";
import { useEffect, useRef, useState } from "react";

const INPUT_DEFAULTS = {
  _force_msgpack: new Uint8Array([]),
  enable_safety_checker: false,
  image_size: {
    width: 768,
    height: 768,
  },
  sync_mode: true,
  num_images: 1,
  num_inference_steps: "2",
};

const MAX_SEED = 10_000_000;
const TOTAL_PLAYBACK_TIME_MS = 30_000; // 30 seconds

function randomSeed() {
  return Math.floor(Math.random() * MAX_SEED).toFixed(0);
}

function splitLyrics(lyrics: string): string[] {
  return lyrics
    .split("\n")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

type UseFalRealtimeProps = {
  lyrics: string;
  isPlaying: boolean;
};

type UseFalRealtimeReturn = {
  currentImage: string | null;
  isGenerating: boolean;
};

export function useFalRealtime({
  lyrics,
  isPlaying,
}: UseFalRealtimeProps): UseFalRealtimeReturn {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const connectionRef = useRef<ReturnType<typeof fal.realtime.connect> | null>(
    null
  );
  const currentSegmentIndexRef = useRef(0);
  const segmentsRef = useRef<string[]>([]);
  const intervalRef = useRef<number | null>(null);
  const seedRef = useRef<number | null>(null);

  useEffect(() => {
    // Configure fal client with proxy URL
    fal.config({
      proxyUrl: `${import.meta.env.VITE_CONVEX_SITE_URL}/api/fal/proxy`,
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      // Clean up connection when not playing
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsGenerating(false);
      currentSegmentIndexRef.current = 0;
      seedRef.current = null;
      return;
    }

    // Split lyrics into segments
    const segments = splitLyrics(lyrics);
    if (segments.length === 0) {
      return;
    }

    segmentsRef.current = segments;
    currentSegmentIndexRef.current = 0;
    setIsGenerating(true);

    // Calculate segment cycle interval based on total playback time and number of segments
    const segmentCycleIntervalMs =
      segments.length > 1 ? TOTAL_PLAYBACK_TIME_MS / segments.length : 0;

    // Generate seed once for the entire playback session
    seedRef.current = Number(randomSeed());

    // Create connection to fal.ai real-time API
    const connection = fal.realtime.connect("fal-ai/flux-schnell-realtime", {
      connectionKey: "flux-schnell-realtime",
      throttleInterval: 64,
      onResult: (result) => {
        if (result.images && result.images.length > 0) {
          const blob = new Blob([result.images[0].content], {
            type: "image/jpeg",
          });
          const imageUrl = URL.createObjectURL(blob);
          setCurrentImage((prevUrl) => {
            // Clean up previous blob URL to avoid memory leaks
            if (prevUrl) {
              URL.revokeObjectURL(prevUrl);
            }
            return imageUrl;
          });
        }
      },
    });

    connectionRef.current = connection;

    // Send initial prompt
    if (seedRef.current !== null) {
      connection.send({
        ...INPUT_DEFAULTS,
        prompt: segments[0],
        seed: seedRef.current,
      });
    }

    // Cycle through segments
    if (
      segments.length > 1 &&
      seedRef.current !== null &&
      segmentCycleIntervalMs > 0
    ) {
      intervalRef.current = window.setInterval(() => {
        currentSegmentIndexRef.current =
          (currentSegmentIndexRef.current + 1) % segments.length;
        const nextPrompt = segments[currentSegmentIndexRef.current];

        connection.send({
          ...INPUT_DEFAULTS,
          prompt: nextPrompt,
          seed: seedRef.current,
        });
      }, segmentCycleIntervalMs);
    }

    // Cleanup on unmount or when isPlaying changes
    return () => {
      if (connection) {
        connection.close();
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, lyrics]);

  return {
    currentImage,
    isGenerating,
  };
}
