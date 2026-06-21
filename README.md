# eve-examples

Hands-on examples for learning [**eve**](https://github.com/vercel/eve), Vercel's
open-source agent framework ("an agent is a directory").

Each numbered folder is a self-contained, runnable example that introduces a few
concepts at a time. Start at `01` and work up.

## Examples

| # | Example | What it covers |
|---|---------|----------------|
| 01 | [oplog-host-cards](./01-oplog-host-cards) | Agent directory layout, typed tools, a custom/self-hosted model, the web UI as an eve-channel client, and rendering tool output as UI cards. |
| 02 | [self-evolving-memory](./02-self-evolving-memory) | A "self-evolving" agent: long-term memory, human-in-the-loop approval (`needsApproval`), and dynamic instructions that inject what was learned into each new session. |

_More to come._

## Design notes

- [Memory consistency in agent long-term memory](./docs/memory-consistency.md)
  ([中文](./docs/memory-consistency.zh-CN.md)) — a problem definition (belief
  revision / stale-fact invalidation) that motivates a future `03` example.
  Defines the gap left open by `02`.
- [How the industry handles memory consistency](./docs/memory-consistency-landscape.md)
  ([中文](./docs/memory-consistency-landscape.zh-CN.md)) — a landscape review of
  Mem0, Zep/Graphiti, Letta, LangMem, A-MEM and the academic foundations, with a
  capability matrix and recommendations for a reconciliation step.

## Prerequisites

- **Node 24+** (eve requires it).
- A model: either a Vercel AI Gateway key (defaults to Claude) or any
  Anthropic-compatible endpoint that supports tool calling. Each example's
  README explains both.

## How to use

```bash
cd 01-oplog-host-cards
npm install
cp .env.local.example .env.local
npm run dev
```

See each example's README for details.

## Notes

These examples are for learning eve and are not production-hardened (auth, rate
limits, secrets handling, etc. are out of scope). Any data shipped in an example
is fictional.
