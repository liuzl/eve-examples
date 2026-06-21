# 02 · self-evolving memory

An [eve](https://github.com/vercel/eve) agent that **evolves across sessions**:
it proposes things worth remembering, the user approves them, and on every new
session those memories are injected back into its system prompt — so each
conversation starts knowing more than the last.

> Based on the pattern in Vercel's
> [`personal-agent-template`](https://github.com/vercel-labs/personal-agent-template)
> (long-term memory with user-approved saves), reduced to a single-user,
> zero-infra example. It reuses example 01's Next.js + eve web-channel shell.

## The idea: controlled self-evolution

"Self-evolving" here does **not** mean the agent rewrites its own source code at
runtime (eve compiles `agent/` at build time, so that wouldn't hot-reload — and
you wouldn't want unbounded self-modification in production anyway). Instead it
evolves the safe, auditable way:

```
propose  →  human approves  →  persist to a store  →  inject next session
```

This is the loop the personal-agent-template uses. The only thing that ever
changes the agent's behavior is **data it accumulated and a human signed off on**.

## What it shows

- **Long-term memory** — four categories (`identity`, `preferences`,
  `projects`, `facts`), each a block of full-replacement prose.
- **Human-in-the-loop** — `save_memory` is gated with `needsApproval: always()`;
  the user sees exactly what will be remembered and approves or denies. The web
  chat renders the approve/deny buttons automatically.
- **Dynamic instructions = the evolution mechanism** — `agent/instructions.ts`
  is a `defineDynamic` resolver that, on `session.started`, reads the store and
  appends the memory to the base prompt. That's why a *new* session already
  knows you.
- **Rendering tool output as UI** — `save_memory`'s result renders as a "Memory
  updated" card (same approach as 01's host cards).

## File map

```
agent/
  agent.ts                  model config (gateway / Anthropic-compatible / Gemini)
  instructions/persona.ts   defineDynamic: base identity + injected memory
  channels/eve.ts           the default eve HTTP channel
  lib/
    memory-categories.ts    the fixed category list
    memory-store.ts         file-backed store + buildMemoryPrompt()
  tools/
    save_memory.ts          propose memory updates (needsApproval: always())
    recall_memory.ts        read current memory mid-session
app/
  _components/
    agent-chat.tsx          useEveAgent() chat (renders approval buttons)
    agent-message.tsx       routes save_memory output → MemoryCard
    memory-card.tsx         renders "Memory updated" as a card
scripts/smoke-test.ts       drive the full evolve loop over HTTP, no browser
memory-store.json           the persisted memory (gitignored; created on first save)
```

## How a request flows

1. You tell the agent something durable ("I prefer bullet-point answers").
2. The model calls `save_memory` with full-replacement prose for the right
   category. Because it's `needsApproval: always()`, the turn **parks** at
   `session.waiting` and the chat shows approve/deny buttons.
3. You approve. `execute` runs and writes `memory-store.json`.
4. **Next session:** `instructions/persona.ts` reads the store and injects a
   "What you remember about this user" block. The model opens already knowing it.

## Run

Requires **Node 24+**.

```bash
npm install
cp .env.local.example .env.local   # add a model (see below)
npm run dev                         # http://localhost:3000
```

Try this two-step demo:

1. Say: `My name is Zhanliang and I like concise, bullet-point answers. Remember that.`
   → approve the memory card.
2. **Reload the page** (new session) and ask: `How do I like my answers?`
   → it answers from memory, without being told again.

Or run it headless:

```bash
npm run dev                      # in one terminal
npx tsx scripts/smoke-test.ts    # EVE_HOST defaults to http://127.0.0.1:3000
```

**Model:** same three options as example 01 — Vercel AI Gateway (Claude, the
default), any Anthropic-compatible endpoint via `LLM_BASE_URL`, or Gemini via
`GEMINI_BASE_URL`. See `.env.local.example` and `agent/agent.ts`.

**Reset memory:** delete `memory-store.json`.

## Notes

- **Why a JSON file?** To keep the example to one `npm run dev` with no database.
  The contract (categories, full-replacement prose, approval gate, dynamic
  injection) is identical to the template — only the backend differs. For
  multi-user or production, swap `agent/lib/memory-store.ts` for your own store
  keyed on `ctx.session.auth` (the template injects per authenticated user).
- **Why approval?** Memory shapes every future session, so a person should sign
  off on what the agent learns. This is eve's human-in-the-loop pause/resume —
  durable, so the turn survives a restart while it waits.
- **Session vs. long-term memory.** This example persists *across* sessions. For
  working memory that lives and dies with a single session (a running counter, a
  glossary for this conversation), use `defineState` instead — see
  `node_modules/eve/docs/guides/state.md`.
