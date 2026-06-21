// A tiny file-backed long-term memory store.
//
// The personal-agent-template persists memory to a per-user database behind an
// HTTP API. To keep this example zero-infra and runnable in one `npm run dev`,
// we persist a single user's memory to a JSON file instead. The shape and the
// "full-replacement prose per category" contract are the same — only the
// backend is swapped. For multi-user / production use, replace these two
// functions with calls to your own store (see README).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { CATEGORY_LABELS, type MemoryCategory, MEMORY_CATEGORIES } from "#lib/memory-categories.ts";

export type Memory = Partial<Record<MemoryCategory, string>>;

function storePath(): string {
  const configured = process.env.MEMORY_FILE;
  if (configured) {
    return isAbsolute(configured) ? configured : join(process.cwd(), configured);
  }
  return join(process.cwd(), "memory-store.json");
}

/** Read the whole memory object. Missing file → empty memory. */
export async function readMemory(): Promise<Memory> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as Memory;
    // Keep only known categories; ignore anything stale.
    const clean: Memory = {};
    for (const cat of MEMORY_CATEGORIES) {
      const value = parsed[cat];
      if (typeof value === "string" && value.trim()) clean[cat] = value;
    }
    return clean;
  } catch {
    return {};
  }
}

/** Replace one category's prose and persist. Returns the updated memory. */
export async function saveMemory(category: MemoryCategory, content: string): Promise<Memory> {
  const current = await readMemory();
  const next: Memory = { ...current, [category]: content.trim() };
  const path = storePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

/**
 * Render memory as a system-prompt block. This is the "evolution" mechanism:
 * what was saved in past sessions is injected into the prompt at the start of
 * the next one (see agent/instructions.ts).
 */
export function buildMemoryPrompt(memory: Memory): string {
  const sections: string[] = [];
  for (const cat of MEMORY_CATEGORIES) {
    const value = memory[cat];
    if (!value) continue;
    sections.push(`## ${CATEGORY_LABELS[cat]}\n${value}`);
  }
  if (sections.length === 0) return "";
  return ["# What you remember about this user", ...sections].join("\n\n");
}
