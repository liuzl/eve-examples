# 01 · ops-log host cards

An [eve](https://github.com/vercel/eve) agent that answers questions about a
machine fleet by calling tools, with a Next.js web UI that renders each tool
result as a card. One project, one dev server.

> This example is a de-identified version of a real internal ops tool. All data
> in `sample-data/` is fictional.

## What it shows

- **eve agent basics** — `agent/` directory layout, typed tools, instructions.
- **A custom / self-hosted model** — point eve at any Anthropic-compatible
  endpoint (this example was built against a local Gemma 4 12B), or use Claude
  via the Vercel AI Gateway.
- **Web UI = the eve channel + `useEveAgent`** — the browser is a client of the
  default eve HTTP channel; there is no separate "web channel" file.
- **Rendering tool output as UI** — the model decides *which tool to call* and
  writes one sentence; the frontend turns the structured tool result into a
  card. The model never generates UI.

## Architecture

```
Browser (localhost:3000)
  │  useEveAgent() — a client of the eve channel
  ▼
Next.js frontend (app/)        ← "Web Chat" = eve channel routes + this frontend
  │  POST /eve/v1/session*  (same origin; withEve proxies to the eve runtime)
  ▼
eve runtime (started by withEve during `npm run dev`)
  └─ durable agent loop
       ├─ tool: lookup_host       (reads sample-data/inventory/hosts.yaml)
       ├─ tool: search_incidents  (reads sample-data/logs/incidents/*.md)
       └─ model: Claude (gateway)  OR  any Anthropic-compatible endpoint
```

### About channels

In eve a channel is the edge adapter between a platform and the agent
(normalizes input, owns the continuation token, decides delivery/rendering).
The web UI is **not** a separate channel — it rides the default eve HTTP channel
(`agent/channels/eve.ts`, the `/eve/v1/session*` routes) and is consumed by
`useEveAgent`. So rendering lives in the frontend. (For Slack/Teams the channel
renders rich UI server-side via card builders; for web it's the frontend's job.)

## File map

```
agent/
  agent.ts                  model + runtime config
  instructions.md           system prompt
  channels/eve.ts           the (only) channel — default eve HTTP routes
  lib/oplog.ts              shared data layer (reads YAML / lists incidents)
  tools/
    lookup_host.ts          query the inventory → structured host data
    search_incidents.ts     search the incident log
app/
  page.tsx                  mounts the chat
  _components/
    agent-chat.tsx          useEveAgent() chat UI
    agent-message.tsx       renders message parts (text / reasoning / tool)
    host-card.tsx           renders lookup_host output as a card
sample-data/                fictional inventory + incidents
scripts/smoke-test.ts       drive the agent over HTTP, no browser
```

## Run

Requires **Node 24+**.

```bash
npm install
cp .env.local.example .env.local   # optional; defaults work with a gateway key
npm run dev                         # http://localhost:3000
```

Then ask: `Tell me about gpu-01` or `What went wrong with web-01?`

**Model:** by default the agent routes through the Vercel AI Gateway (Claude) —
provide `AI_GATEWAY_API_KEY` or run `eve link`. To use a local/self-hosted model
instead, set `LLM_BASE_URL` (+ `LLM_MODEL`) to an Anthropic-compatible endpoint
that supports tool calling. See `.env.local.example` and `agent/agent.ts`.

**Data:** defaults to `./sample-data`. Point `OPLOG_DIR` at your own directory
(same `inventory/hosts.yaml` + `logs/incidents/*.md` shape) to use real data.

## How a request flows

1. `useEveAgent().send()` → `POST /eve/v1/session`; `withEve` routes it to the
   eve runtime (same origin, no CORS).
2. eve starts a **durable turn**: instructions + tool descriptors + the user
   message go to the model.
3. The model calls `lookup_host` (a `tool_use`). eve runs the tool in the app
   runtime (it can read files / env, import `lib/`).
4. The result is streamed back as NDJSON events; `useEveAgent` folds them into
   `message.parts`. The `dynamic-tool` part carries `part.output`.
5. `agent-message.tsx` renders `<HostCards output={part.output} />` for
   `lookup_host`. The model's own reply is just one sentence.

## Notes

- **Custom provider needs a context window.** A provider created with
  `createAnthropic({ baseURL })` has no AI Gateway metadata, so eve's compaction
  can't look up the window — pass `modelContextWindowTokens` explicitly (see
  `agent/agent.ts`).
- **Why render tool output instead of model-generated UI?** It doesn't depend on
  the model emitting a valid UI spec, so it's reliable even with small local
  models. The tradeoff: the card layout is fixed in code, not composed by the
  model. For open-ended, model-composed UIs you'd reach for a generative-UI
  library instead.
