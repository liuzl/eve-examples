import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

/**
 * Root of the "ops log" data this example reads. Defaults to the bundled
 * `sample-data/` so the example runs with no setup; point it at your own data
 * with OPLOG_DIR in .env.local.
 */
export function oplogDir(): string {
  return process.env.OPLOG_DIR ?? join(process.cwd(), "sample-data");
}

export interface Host {
  name: string;
  old_name?: string | null;
  tailscale_ip?: string | null;
  platform?: string | null;
  lan_ip?: string | null;
  role?: string | null;
  status?: string | null;
  latency?: string | null;
  notes?: string | null;
}

export async function loadHosts(): Promise<Host[]> {
  const raw = await readFile(join(oplogDir(), "inventory", "hosts.yaml"), "utf8");
  const doc = parseYaml(raw) as { hosts?: Host[] };
  return doc.hosts ?? [];
}

export interface IncidentMeta {
  file: string; // filename
  date: string; // YYYY-MM-DD from filename
  hostSlug: string; // host segment guessed from filename
  title: string; // first markdown heading
  machine?: string; // "Affected host" line if present
  severity?: string; // "Severity" line if present
}

const QUOTE_FIELD = (body: string, label: string): string | undefined => {
  // matches lines like: > **Affected host**: gpu-01 (100.64.1.20)
  const re = new RegExp(`\\*\\*${label}\\*\\*\\s*[:：]\\s*(.+)`);
  const m = body.match(re);
  return m?.[1]?.trim();
};

export async function listIncidents(): Promise<IncidentMeta[]> {
  const dir = join(oplogDir(), "logs", "incidents");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  const out: IncidentMeta[] = [];
  for (const file of files) {
    const body = await readFile(join(dir, file), "utf8");
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    const titleMatch = body.match(/^#\s+(.+)$/m);
    out.push({
      file,
      date: dateMatch?.[1] ?? "",
      hostSlug: dateMatch?.[2] ?? file.replace(/\.md$/, ""),
      title: titleMatch?.[1]?.trim() ?? file,
      machine: QUOTE_FIELD(body, "Affected host"),
      severity: QUOTE_FIELD(body, "Severity"),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function readIncident(file: string): Promise<string> {
  return readFile(join(oplogDir(), "logs", "incidents", file), "utf8");
}
