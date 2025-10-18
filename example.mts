// example.mts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: "sk_300c631d3c441271701b4b58031d677b399e326334e1133b",
});

const compositionPlan = await elevenlabs.music.compositionPlan.create({
  prompt:
    "Create an intense, fast-paced electronic track for a high-adrenaline video game scene. Use driving synth arpeggios, punchy drums, distorted bass, glitch effects, and aggressive rhythmic textures. The tempo should be fast, 130–150 bpm, with rising tension, quick transitions, and dynamic energy bursts.",
  musicLengthMs: 10_000,
});

console.log(JSON.stringify(compositionPlan, null, 2));

const track = await elevenlabs.music.compose({
  compositionPlan,
});

console.log(JSON.stringify(track, null, 2));
