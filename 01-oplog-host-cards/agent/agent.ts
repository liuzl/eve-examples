import { createAnthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

// Two ways to pick a model:
//
// 1. Default — route through the Vercel AI Gateway (set AI_GATEWAY_API_KEY, or
//    run `eve link`). Uses Claude.
//
// 2. Local / self-hosted — set LLM_BASE_URL to any Anthropic-compatible endpoint
//    that supports tool calling (llama.cpp, Ollama via a proxy, etc.). This is
//    how the example was built (a local Gemma 4 12B). See README.
const baseURL = process.env.LLM_BASE_URL;

export default defineAgent(
  baseURL
    ? {
        model: createAnthropic({
          baseURL,
          apiKey: process.env.LLM_API_KEY ?? "local",
        })(process.env.LLM_MODEL ?? "local-model"),
        // A custom provider has no AI Gateway metadata, so give eve the context
        // window explicitly (used by compaction).
        modelContextWindowTokens: Number(process.env.LLM_CONTEXT_TOKENS ?? 131072),
      }
    : {
        model: "anthropic/claude-sonnet-4.6",
      },
);
