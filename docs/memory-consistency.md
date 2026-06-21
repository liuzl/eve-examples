# The Memory Consistency Problem in Agent Long-Term Memory

> **中文版:** [memory-consistency.zh-CN.md](./memory-consistency.zh-CN.md)
>
> **Status:** problem definition. This document defines a problem; it does **not**
> prescribe a solution. It motivates a future `03` example.
>
> **Context:** Example [`02-self-evolving-memory`](../02-self-evolving-memory)
> gives an agent durable, user-approved long-term memory and injects it into
> every new session. That example deliberately stops at the simplest design —
> four categories, full-replacement prose per category, whole-memory injection.
> It can **remember** and **use** facts, but it cannot **revise its own beliefs**
> when a premise changes. This document defines that gap precisely.

---

## 1. Problem statement

An agent's long-term memory is **not** a set of independent facts. It is a web of
facts with implicit **dependencies**, **validity windows**, and **provenance**.
When one fact changes, every fact that depended on it should be revised,
invalidated, or re-derived.

A memory system that only **adds** and **retrieves** facts — but never
**reconciles** them — accumulates stale and mutually contradictory beliefs over
time. As the memory grows, the probability that some stored belief contradicts
another (or contradicts reality) trends toward one.

We call this the **memory consistency** problem (closely related to the classical
notions of **belief revision** and **truth maintenance**).

The core asymmetry: most memory systems treat **"remember"** as a first-class
operation and **"forget / invalidate"** as an afterthought (or as something the
user must request explicitly). In reality, invalidation is usually **silent and
inferred** — the user never says "forget that"; they just state a new fact whose
consequences ripple outward.

---

## 2. Running example

| Time | The user says | What memory should hold afterward |
| ---- | ------------- | --------------------------------- |
| T0 | "I live in Singapore, a 15-minute walk from my office." | `home = Singapore`; `commute = 15-min walk` **(derived from** home + office location**)** |
| T1 (weeks later) | "I've moved to Seattle." | `home = Seattle`; `commute = 15-min walk` is now **unverified / likely invalid** and must be revised or dropped |
| T2 | (a new session; the agent answers questions) | The agent must **not** still believe the user walks 15 minutes to work |

**The crux:** at T1 the user changed exactly one fact (`home`). They said nothing
about their commute. A correct system must infer that `commute` *depended on*
`home` and is now stale. The flat-prose memory in `02` has no representation of
that dependency, so the stale fact typically survives — the agent ends up
believing both "lives in Seattle" and "walks 15 minutes to the office."

This example is only an illustration. The same structure appears everywhere
(see §3).

---

## 3. Taxonomy of failure modes

All of these share one shape: **a stored belief should change as a consequence of
new information, but nothing in the system forces that consequence.**

| # | Failure mode | Concrete example | What a correct system should do |
| - | ------------ | ---------------- | ------------------------------- |
| F1 | **Stale derived fact** | Home changes; commute/neighbors/timezone/local-habits were derived from it | Invalidate or re-derive every dependent fact |
| F2 | **Direct contradiction** | "I'm vegetarian" → later "I've started eating fish" | Detect the conflict; replace, don't append |
| F3 | **Temporal expiry** | "My daughter is 3." / "I work at Acme." | Treat as valid-as-of, not eternally true; age or re-confirm |
| F4 | **Entity-change cascade** | "My manager is Zhang." → Zhang leaves the company | Decide per fact: invalidate, transfer, or archive everything keyed on that entity |
| F5 | **Duplication / fragmentation** | The same preference is stated three times across sessions | Merge into one canonical entry; don't grow unbounded |
| F6 | **Silent retraction** | The user simply stops mentioning a project; or states a new fact that implies the old is over | Infer the retraction from context; the user rarely says "forget X" |
| F7 | **Scope / granularity drift** | "I like concise answers" (general) vs. "for this report, be detailed" (local) | Don't promote a one-off into a standing belief, and vice versa |

F1, F4, and F6 are the hardest because the **trigger is implicit**: the user's new
statement does not name the fact that must change.

---

## 4. Why flat-prose memory fails (root cause)

The design in `02` stores, per category, a block of natural-language prose — the
**conclusions**, with the **premises and links between them discarded**. That one
choice causes three structural failures:

1. **No contradiction detection.** There is no structured representation to
   compare against, so the system cannot notice that a new fact conflicts with a
   stored one. Detection is left entirely to the model re-reading everything.
2. **No cascade.** Because dependencies (`commute` *depends on* `home`) are not
   recorded, the system cannot propagate a change from a premise to its
   dependents. It does not know what to revisit.
3. **No mechanism for forgetting.** "Invalidate" is not an operation; the only
   write is "replace a category's prose." Whether a stale fact disappears depends
   on the model spontaneously choosing to omit it while rewriting.

Worse, `02`'s instructions tell the model to write *"the existing content **plus**
the new detail."* That wording biases toward **accumulation** — it nudges the
model to **keep** the old commute claim, which is the opposite of what F1 needs.

The deeper point: **this cannot be fixed by a smarter single prompt.** Relying on
the LLM to re-read all of memory and reason about consistency on every write
degrades as memory grows — more facts, more possible interactions, more chances
to miss one. Consistency needs a **mechanism**, not just a better instruction.

---

## 5. What a consistent memory system must be able to do

These are **capabilities the problem demands**, stated as requirements (not a
design). A solution will satisfy them in some form.

- **C1 — Provenance.** Each belief records where it came from (which user
  statement, which session, when) and, where relevant, what it was **derived
  from**.
- **C2 — Dependency / derivation links.** Derived beliefs point at the beliefs
  they depend on, so a change to a premise can find its dependents.
- **C3 — Temporal validity.** Beliefs are *valid-as-of* a time, not eternally
  true. Some carry an expectation of expiry or re-confirmation.
- **C4 — Contradiction detection.** On new input, the system can find stored
  beliefs that the input conflicts with or undermines.
- **C5 — Cascade invalidation / re-derivation.** Changing a belief triggers a
  pass over its dependents to update, invalidate, or re-derive them.
- **C6 — Deduplication / merge.** Repeated or overlapping statements converge to
  one canonical belief instead of accumulating.
- **C7 — Forgetting as a first-class operation.** "Invalidate" / "retract" /
  "archive" are explicit operations, ideally auditable (what was dropped, and
  why), not a side effect of rewriting prose.
- **C8 — Confidence / status.** A belief can be *confirmed*, *inferred*,
  *stale-suspected*, or *retracted* — not just present/absent.

### The reconciliation step

The capabilities above imply an operation that `02` lacks entirely. Call it
**reconciliation**: given *(current memory, new information)*, produce a
**consistent successor memory** plus a **changelog** of what was added, updated,
invalidated, merged, or flagged for re-confirmation. Reconciliation — not raw
"append a fact" — is the real write path of a consistent memory system. Where it
runs (write-time, a background pass, on read), and whether a human approves its
changelog, are **design** questions left open here.

---

## 6. Scope and non-goals

**In scope.** Single-user *personal* long-term memory: durable beliefs about the
user and their world (identity, preferences, situation, relationships, projects),
across sessions.

**Out of scope (for this problem definition).**

- **Episodic / transcript memory** — verbatim recall of past conversations. This
  doc is about *semantic* beliefs, not logs.
- **Document RAG** — retrieval over an external corpus. That is a retrieval
  problem; this is a *consistency-of-beliefs* problem.
- **Multi-user / shared memory** and cross-user conflict resolution.
- **Privacy, PII, and the right-to-be-forgotten** as a compliance concern. Real,
  but a separate axis from logical consistency.
- **Prescribing the data model or algorithm.** Intentionally undefined here.

---

## 7. How to know a solution works (evaluation scenarios)

A solution should be judged by **memory state transitions**, not by chat replies
alone. Each scenario below is a sequence of inputs and the expected memory after
each — these become the eval for a future `03` example.

1. **Move (F1).** "Singapore, 15-min walk" → "moved to Seattle". *Expect:* home
   updated; commute invalidated or flagged stale; no surviving "15-min walk".
2. **Diet flip (F2).** "vegetarian" → "started eating fish". *Expect:* one
   coherent dietary belief; no contradictory pair.
3. **Job change cascade (F4).** "works at Acme, manager Zhang, commutes downtown"
   → "left Acme". *Expect:* employer/ manager / commute all revisited, not just
   employer.
4. **Repetition (F5).** The same preference stated in three sessions. *Expect:* a
   single canonical entry, not three.
5. **Silent drop (F6).** Active project mentioned for weeks, then a new statement
   implies it shipped/ended. *Expect:* the old project is archived/closed without
   the user saying "forget it".

A passing solution leaves memory **internally consistent and current** after each
step, with an auditable record of *what changed and why*.

---

## 8. Glossary & related work

- **Belief revision** — the study of how a rational agent should change its
  beliefs given new, possibly conflicting information (classically, the *AGM*
  framework). The problem here is an applied instance of it.
- **Truth maintenance system (TMS / JTMS)** — a classic AI mechanism that records
  *justifications* for beliefs and retracts dependents when a justification fails.
  Directly relevant to C2 + C5.
- **Temporal / bitemporal knowledge** — modeling facts as valid over time windows
  rather than as eternal truths (C3).
- **Knowledge editing in LLMs** — updating a model's stored knowledge without full
  retraining; related, but about *weights*, whereas this doc is about an
  *external, inspectable memory store*.
- **Memory consolidation / reconciliation** — the (less standardized) term used in
  the agent-memory space for periodically compacting and de-conflicting
  accumulated memory.

---

## 9. Relationship to the examples in this repo

- [`02-self-evolving-memory`](../02-self-evolving-memory) demonstrates the
  **propose → approve → persist → inject** loop. It is the *baseline* this problem
  is defined against: good at *remembering*, unable to *revise*.
- A future **`03`** example would add a **reconciliation** step satisfying some of
  §5's capabilities, and would be evaluated against §7's scenarios — using the
  Singapore → Seattle move as the headline test.
