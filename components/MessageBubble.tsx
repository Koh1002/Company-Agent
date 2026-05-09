"use client";

import { Bot, User, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { UIMessage } from "ai";

type Part = UIMessage["parts"][number];

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-[var(--color-accent)]"
            : "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)]"
        }`}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      <div
        className={`max-w-[85%] space-y-2 ${isUser ? "items-end text-right" : "items-start text-left"}`}
      >
        {message.parts.map((part, i) => (
          <PartView key={i} part={part} isUser={isUser} />
        ))}
      </div>
    </div>
  );
}

function PartView({ part, isUser }: { part: Part; isUser: boolean }) {
  if (part.type === "text") {
    return (
      <div
        className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--color-accent)] text-white"
            : "bg-[var(--color-panel)] text-[var(--color-fg)]"
        }`}
      >
        {part.text}
      </div>
    );
  }
  if (part.type === "reasoning") {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-2)]/50 px-3 py-2 text-xs italic text-[var(--color-fg-muted)]">
        {part.text}
      </div>
    );
  }
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return <ToolInvocationView part={part as ToolPart} />;
  }
  return null;
}

type ToolPart = {
  type: string;
  state?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ToolInvocationView({ part }: { part: ToolPart }) {
  const [open, setOpen] = useState(false);
  const toolName = part.type.replace(/^tool-/, "");
  const state = part.state ?? "";
  const isStreaming =
    state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";
  const label = isError
    ? "失敗"
    : isDone
      ? "完了"
      : isStreaming
        ? "実行中..."
        : "待機";
  const color = isError
    ? "border-red-500/40 bg-red-500/10 text-red-200"
    : isDone
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-amber-500/30 bg-amber-500/10 text-amber-200";

  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${color}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Wrench size={12} />
        <span className="font-mono font-semibold">{toolName}</span>
        <span className="ml-auto opacity-70">{label}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {part.input !== undefined && (
            <div>
              <div className="mb-0.5 text-[10px] uppercase opacity-60">input</div>
              <pre className="overflow-x-auto rounded bg-black/30 p-2 font-mono text-[11px] leading-snug">
                {safeJson(part.input)}
              </pre>
            </div>
          )}
          {isDone && part.output !== undefined && (
            <div>
              <div className="mb-0.5 text-[10px] uppercase opacity-60">output</div>
              <pre className="overflow-x-auto rounded bg-black/30 p-2 font-mono text-[11px] leading-snug">
                {safeJson(part.output)}
              </pre>
            </div>
          )}
          {isError && part.errorText && (
            <div className="rounded bg-black/30 p-2 font-mono text-[11px]">
              {part.errorText}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
