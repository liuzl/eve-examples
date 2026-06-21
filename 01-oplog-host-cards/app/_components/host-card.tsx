"use client";

// Render lookup_host's structured output as a card, directly in the web
// frontend (the eve-channel client). The tool returns data; the frontend
// decides how to draw it. The model never generates UI.

type Host = {
  name: string;
  tailscale_ip?: string | null;
  platform?: string | null;
  role?: string | null;
  status?: string | null;
  latency?: string | null;
  notes?: string | null;
};

const card: React.CSSProperties = {
  border: "1px solid #2a2f3a",
  borderRadius: 12,
  overflow: "hidden",
  background: "#0f1320",
  maxWidth: 460,
  marginTop: 8,
};
const title: React.CSSProperties = {
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 16,
  borderBottom: "1px solid #2a2f3a",
  background: "#141a2b",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};
const body: React.CSSProperties = { padding: "8px 16px 14px" };
const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "6px 0",
  borderBottom: "1px dashed #1e2433",
};
const label: React.CSSProperties = { color: "#8b93a3", flexShrink: 0 };
const value: React.CSSProperties = { textAlign: "right", wordBreak: "break-word" };
const badge: React.CSSProperties = {
  background: "rgba(63,185,80,.15)",
  color: "#3fb950",
  border: "1px solid rgba(63,185,80,.4)",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 12,
  fontWeight: 600,
};
const notes: React.CSSProperties = {
  marginTop: 10,
  color: "#8b93a3",
  fontSize: 12,
  lineHeight: 1.5,
};

function Row({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return (
    <div style={row}>
      <span style={label}>{k}</span>
      <span style={value}>{v}</span>
    </div>
  );
}

function HostCard({ host }: { host: Host }) {
  return (
    <div style={card}>
      <div style={title}>
        <span>{host.name}</span>
        {host.status && <span style={badge}>{host.status}</span>}
      </div>
      <div style={body}>
        {host.role && (
          <div style={{ fontWeight: 600, color: "#6ea8fe", margin: "4px 0 8px" }}>{host.role}</div>
        )}
        <Row k="Tailscale IP" v={host.tailscale_ip} />
        <Row k="Platform" v={host.platform} />
        <Row k="Latency" v={host.latency} />
        {host.notes && <div style={notes}>{host.notes}</div>}
      </div>
    </div>
  );
}

/** Defensively coerce the tool output into a Host[] and render a card each. */
export function HostCards({ output }: { output: unknown }) {
  const hosts = (output as { hosts?: Host[] } | null)?.hosts;
  if (!Array.isArray(hosts) || hosts.length === 0) return null;
  return (
    <div>
      {hosts.map((h) => (
        <HostCard host={h} key={h.name} />
      ))}
    </div>
  );
}
