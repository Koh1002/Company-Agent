"use client";

import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import type { AgentMetadata } from "@/lib/agents/metadata";
import { CATEGORY_LABEL } from "@/lib/agents/metadata";

const CATEGORY_COLOR: Record<AgentMetadata["category"], string> = {
  manufacturer: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  wholesale: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  retail: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  common: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export function AgentCard({ agent }: { agent: AgentMetadata }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-5 transition hover:border-[var(--color-accent)] hover:bg-[var(--color-panel-2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[agent.category]}`}
        >
          {CATEGORY_LABEL[agent.category]}
        </span>
        <ArrowRight
          size={18}
          className="text-[var(--color-fg-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]"
        />
      </div>
      <h3 className="mt-3 text-base font-semibold text-[var(--color-fg)]">
        {agent.name}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
        {agent.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {agent.toolNames.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-panel-2)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]"
          >
            <Wrench size={10} />
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
