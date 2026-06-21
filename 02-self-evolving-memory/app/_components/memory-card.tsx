"use client";

// Renders save_memory's structured output as a card — same "render tool output
// as UI" idea as example 01. After the user approves, the tool returns the new
// memory state and we show what was remembered.
import { BrainIcon } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity",
  preferences: "Preferences",
  projects: "Projects",
  facts: "Facts",
};

type SaveMemoryOutput = {
  readonly saved?: readonly string[];
  readonly memory?: Record<string, string>;
};

export function MemoryCard({ output }: { readonly output: unknown }) {
  const data = output as SaveMemoryOutput | null | undefined;
  if (!data?.memory) return null;

  const saved = new Set(data.saved ?? []);
  const entries = Object.entries(data.memory).filter(([, v]) => typeof v === "string" && v.trim());
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
      <div className="mb-2 flex items-center gap-2 font-medium text-emerald-700 text-sm dark:text-emerald-300">
        <BrainIcon className="size-4" />
        Memory updated
      </div>
      <dl className="space-y-2">
        {entries.map(([category, content]) => (
          <div key={category}>
            <dt className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              {CATEGORY_LABELS[category] ?? category}
              {saved.has(category) ? (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[10px] text-emerald-700 dark:text-emerald-300">
                  saved
                </span>
              ) : null}
            </dt>
            <dd className="mt-0.5 text-sm">{content}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
