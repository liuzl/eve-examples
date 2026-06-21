// Smoke-test the agent over the eve HTTP channel without the browser.
// Start the app first (`npm run dev`), then: `npx tsx scripts/smoke-test.ts`
//
// It sends one message and checks that the model called lookup_host and that the
// tool output (the data the web card renders) reached the client.
import { Client } from "eve/client";

const host = process.env.EVE_HOST ?? "http://127.0.0.1:3000";
const client = new Client({ host });

const session = await client.session();
const res = await session.send({ message: "Tell me about gpu-01" });
const result = await res.result();

const events = (result.events ?? []) as Array<Record<string, unknown>>;
const blob = JSON.stringify(events);

console.log("status:", result.status);
console.log("event types:", [...new Set(events.map((e) => e.type))].join(", "));
console.log("tool output reached client:", blob.includes("tailscale_ip"));
console.log("\nassistant text:\n" + (result.message ?? "(none)").trim());
