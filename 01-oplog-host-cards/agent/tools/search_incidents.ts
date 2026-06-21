import { defineTool } from "eve/tools";
import { z } from "zod";
import { listIncidents, readIncident } from "#lib/oplog.ts";

export default defineTool({
  description:
    "Search the incident log (logs/incidents/*.md). Filter by a keyword that " +
    "matches the title, host, machine, or filename. Set full=true to also return " +
    "the complete markdown of each match (use a specific query first to keep it small).",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Case-insensitive keyword, e.g. 'gpu-01', 'driver', 'nat'."),
    full: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include the full markdown body of each matched incident."),
    limit: z.number().int().positive().max(50).optional().default(10),
  }),
  async execute({ query, full, limit }) {
    const all = await listIncidents();
    const q = query?.trim().toLowerCase();
    const matched = (
      q
        ? all.filter((i) =>
            [i.title, i.hostSlug, i.machine, i.file]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
          )
        : all
    ).slice(0, limit);

    const results = [];
    for (const i of matched) {
      results.push({
        file: i.file,
        date: i.date,
        title: i.title,
        machine: i.machine ?? null,
        severity: i.severity ?? null,
        ...(full ? { body: await readIncident(i.file) } : {}),
      });
    }
    return { total: all.length, matched: results.length, incidents: results };
  },
});
