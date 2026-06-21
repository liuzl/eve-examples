// Smoke-test the self-evolution loop over the eve HTTP channel, no browser.
// Start the app first (`npm run dev`), then: `npx tsx scripts/smoke-test.ts`
//
// It proves the agent evolves across sessions:
//   1. Session A: tell it something durable → it calls save_memory (which is
//      approval-gated) → we approve → the fact is persisted to memory-store.json.
//   2. Session B (a brand-new session): ask about that fact → it answers from
//      the memory that was injected into its system prompt at session start.
import { Client } from "eve/client";

const host = process.env.EVE_HOST ?? "http://127.0.0.1:3000";
const client = new Client({ host });

// ── Session A: teach it, then approve the save ──────────────────────────────
const teach = client.session();
const response = await teach.send({
  message:
    "My name is Zhanliang and I prefer concise, bullet-point answers. Please remember that about me.",
});

// result() is single-use and already surfaces any pending approval requests.
const first = await response.result();
const pending = first.inputRequests ?? [];
console.log("session A status:", first.status);
console.log("approval requested:", pending.length > 0);

if (pending.length > 0) {
  const resumed = await teach.send({
    inputResponses: pending.map((request) => ({
      requestId: request.requestId,
      // Approve the proposed memory. Options are { approve, deny }.
      optionId: request.options?.some((o) => o.id === "approve") ? "approve" : request.options?.[0]?.id ?? "approve",
    })),
  });
  const approved = await resumed.result();
  const blob = JSON.stringify(approved.events ?? []);
  console.log("memory persisted:", blob.toLowerCase().includes("zhanliang"));
  console.log("\nsession A reply:\n" + (approved.message ?? "(none)").trim());
}

// ── Session B: a fresh session should already know the user ──────────────────
const fresh = client.session();
const ask = await fresh.send({
  message: "What's my name, and how do I like my answers formatted?",
});
const recalled = await ask.result();
const reply = (recalled.message ?? "").trim();
console.log("\nsession B status:", recalled.status);
console.log("recalled name:", /zhanliang/i.test(reply));
console.log("recalled preference:", /bullet|concise/i.test(reply));
console.log("\nsession B reply (a NEW session, no prior turns):\n" + (reply || "(none)"));

// The eve client keeps a connection open; exit explicitly so the script ends.
process.exit(0);
