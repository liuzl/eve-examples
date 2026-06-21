import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defineAgent } from "eve";

// Ways to pick a model:
//
// 1. Default — route through the Vercel AI Gateway (set AI_GATEWAY_API_KEY, or
//    run `eve link`). Uses Claude.
//
// 2. Local / self-hosted — set LLM_BASE_URL to any Anthropic-compatible endpoint
//    that supports tool calling (llama.cpp, Ollama via a proxy, etc.). This is
//    how the example was built (a local Gemma 4 12B). See README.
//
// 3. Gemini — set GEMINI_BASE_URL (a Google Generative Language endpoint or a
//    compatible proxy) to use the native @ai-sdk/google provider.
const baseURL = process.env.LLM_BASE_URL;
const geminiBaseURL = process.env.GEMINI_BASE_URL;

export default defineAgent(
  geminiBaseURL
    ? {
        model: createGoogleGenerativeAI({
          // @ai-sdk/google appends /models/<model>:generateContent to baseURL.
          baseURL: `${geminiBaseURL.replace(/\/$/, "")}/v1beta`,
          apiKey: process.env.GEMINI_API_KEY,
        })(process.env.GEMINI_MODEL ?? "gemini-3-flash-preview"),
        // A custom provider has no AI Gateway metadata, so give eve the context
        // window explicitly (used by compaction).
        modelContextWindowTokens: Number(process.env.GEMINI_CONTEXT_TOKENS ?? 1048576),
      }
    : baseURL
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
