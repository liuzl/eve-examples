import { defineTool } from "eve/tools";
import { z } from "zod";
import { readMemory } from "#lib/memory-store.ts";

export default defineTool({
  description:
    "Read everything currently stored in long-term memory about the user. The session prompt already includes this, but call it to re-check mid-conversation.",
  inputSchema: z.object({}),
  async execute() {
    return { memory: await readMemory() };
  },
});
