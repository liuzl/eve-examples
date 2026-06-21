import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { MEMORY_CATEGORIES } from "#lib/memory-categories.ts";
import { type Memory, saveMemory } from "#lib/memory-store.ts";

const updateSchema = z.object({
  category: z.enum(MEMORY_CATEGORIES).describe("Which memory category to replace"),
  content: z
    .string()
    .min(1)
    .describe("Full replacement prose for this category (existing content + the new detail, not a partial delta)"),
});

export default defineTool({
  description:
    "Propose saving long-term memory about the user so it survives into future sessions. Requires one user approval for the whole batch. When several categories change, include every update in a single call — never make parallel save_memory calls.",
  inputSchema: z.object({
    reason: z.string().min(1).describe("Brief explanation of why this is worth remembering"),
    updates: z.array(updateSchema).min(1).max(MEMORY_CATEGORIES.length).describe("Category updates to save together"),
  }),
  // Human-in-the-loop: the user sees and approves what gets remembered.
  needsApproval: always(),
  async execute({ updates }) {
    let memory: Memory = {};
    for (const update of updates) {
      memory = await saveMemory(update.category, update.content);
    }
    return {
      saved: updates.map((u) => u.category),
      memory,
    };
  },
});
