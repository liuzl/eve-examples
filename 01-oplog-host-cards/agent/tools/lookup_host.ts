import { defineTool } from "eve/tools";
import { z } from "zod";
import { loadHosts } from "#lib/oplog.ts";

export default defineTool({
  description:
    "Look up machines in the Tailscale fleet inventory (inventory/hosts.yaml). " +
    "Pass a query to match by hostname, old name, role, platform, or notes. " +
    "Omit the query to list every host.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Case-insensitive substring, e.g. 'web-01', 'exit node', 'gpu'."),
  }),
  async execute({ query }) {
    const hosts = await loadHosts();
    const q = query?.trim().toLowerCase();
    const matched = q
      ? hosts.filter((h) =>
          [h.name, h.old_name, h.role, h.platform, h.notes, h.tailscale_ip]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
        )
      : hosts;
    return {
      count: matched.length,
      hosts: matched.map((h) => ({
        name: h.name,
        tailscale_ip: h.tailscale_ip ?? null,
        platform: h.platform ?? null,
        role: h.role ?? null,
        status: h.status ?? null,
        latency: h.latency ?? null,
        notes: h.notes ?? null,
      })),
    };
  },
});
