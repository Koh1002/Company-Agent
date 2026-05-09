"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowLeft, Send, Sparkles, Square } from "lucide-react";
import { buildHeaders, loadCredentials } from "@/lib/credentials";
import type { AgentMetadata } from "@/lib/agents/metadata";
import { CATEGORY_LABEL } from "@/lib/agents/metadata";
import { MessageBubble } from "./MessageBubble";

export function AgentChat({ agent }: { agent: AgentMetadata }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/chat/${agent.id}`,
      headers: () => {
        const c = loadCredentials();
        return c ? buildHeaders(c) : {};
      },
    }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status === "streaming" || status === "submitted") return;
    const text = input;
    setInput("");
    await sendMessage({ text });
  }

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            <ArrowLeft size={14} /> 一覧へ
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold">{agent.name}</h1>
              <span className="rounded-md bg-[var(--color-panel-2)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
                {CATEGORY_LABEL[agent.category]}
              </span>
            </div>
            <p className="text-xs text-[var(--color-fg-muted)]">
              {agent.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {agent.toolNames.map((t) => (
            <span
              key={t}
              className="rounded-md bg-[var(--color-panel-2)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-fg-muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-fg-muted)]">
                <Sparkles size={14} /> サンプルプロンプト
              </div>
              <div className="space-y-2">
                {agent.samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(p)}
                    className="block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 text-left text-sm text-[var(--color-fg-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)]"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              エラー: {error.message}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-3"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="メッセージを入力 (Cmd/Ctrl+Enter で送信)"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            disabled={busy}
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500"
            >
              <Square size={14} /> 停止
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send size={14} /> 送信
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
