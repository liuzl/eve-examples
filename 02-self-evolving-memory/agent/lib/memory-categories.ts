// The fixed set of long-term memory categories. Each category holds one block
// of full-replacement prose (not an append log), mirroring the
// personal-agent-template's model. Keep this list short and orthogonal — the
// model routes a remembered fact into exactly one of these.
export const MEMORY_CATEGORIES = [
  "identity", //     who the user is: name, role, pronouns, location
  "preferences", //  how they want the agent to behave / communicate
  "projects", //     what they're working on right now
  "facts", //        durable context worth remembering across sessions
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  identity: "Identity",
  preferences: "Preferences",
  projects: "Projects",
  facts: "Facts",
};
