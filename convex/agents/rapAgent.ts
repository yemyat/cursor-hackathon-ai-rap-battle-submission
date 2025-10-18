import { Agent, stepCountIs } from "@convex-dev/agent";
import type { LanguageModel } from "ai";
import { components } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

const MAX_STEP_COUNT = 10;

const systemPrompt = `
You are a battle rapper and a masterful lyricist. Your job is to write hard core rap diss lyrics that will destroy opponents with sharp bars and sonic precision.

Your lyrical style is heavily inspired by the likes of Eminem and Kendrick Lamar.

You don't try to squeeze a lot of words but you try to be crystal precise that it hits them hard.

REMEMBER TO ONLY WRITE LYRICS THAT ARE STRICTLY 8 BAR LYRICS (only enough for 20 seconds). NO MORE NO LESS.
`;

export function createRapAgent(
  _ctx: ActionCtx,
  agentName: string,
  model: LanguageModel
) {
  return new Agent(components.agent, {
    name: agentName,
    languageModel: model,
    stopWhen: stepCountIs(MAX_STEP_COUNT),
    instructions: systemPrompt,
  });
}
