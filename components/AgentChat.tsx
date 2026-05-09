"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowLeft, Send, Sparkles, Square, Wrench, X } from "lucide-react";
import { buildHeaders, loadCredentials } from "@/lib/credentials";
import type { AgentMetadata } from "@/lib/agents/metadata";
import { CATEGORY_LABEL } from "@/lib/agents/metadata";
import { MessageBubble } from "./MessageBubble";

export function AgentChat({ agent }: { agent: AgentMetadata }) {
  const [input, setInput] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
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
    <div className="flex h-dvh flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
        <div className="flex items-start gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <Link
            href="/"
            aria-label="一覧へ戻る"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] sm:h-auto sm:w-auto sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-xs"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">一覧へ</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="truncate text-sm font-semibold sm:text-base">
                {agent.name}
              </h1>
              <span className="rounded-md bg-[var(--color-panel-2)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
                {CATEGORY_LABEL[agent.category]}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--color-fg-muted)] sm:line-clamp-1 sm:text-xs">
              {agent.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToolsOpen((v) => !v)}
            aria-label="ツール一覧"
            aria-expanded={toolsOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] sm:hidden"
          >
            {toolsOpen ? <X size={16} /> : <Wrench size={16} />}
          </button>
          <div className="hidden flex-wrap justify-end gap-1.5 sm:flex sm:max-w-[40%]">
            {agent.toolNames.map((t) => (
              <span
                key={t}
                className="rounded-md bg-[var(--color-panel-2)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-fg-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {toolsOpen && (
          <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-border)] px-3 pb-2.5 pt-2 sm:hidden">
            {agent.toolNames.map((t) => (
              <span
                key={t}
                className="rounded-md bg-[var(--color-panel-2)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-fg-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--color-fg-muted)] sm:text-sm">
                <Sparkles size={14} /> サンプルプロンプト
              </div>
              <div className="space-y-2">
                {agent.samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(p)}
                    className="block w-full whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2.5 text-left text-xs leading-relaxed text-[var(--color-fg-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)] sm:text-sm"
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
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200 sm:text-sm">
              エラー: {error.message}
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="safe-pb border-t border-[var(--color-border)] bg-[var(--color-panel)] px-3 pt-2 sm:px-6 sm:pt-3"
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
            placeholder="メッセージを入力"
            rows={2}
            className="max-h-40 flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            disabled={busy}
          />
          {busy ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="停止"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-500 sm:w-auto sm:gap-1.5 sm:px-4 sm:text-sm sm:font-semibold"
            >
              <Square size={16} />
              <span className="hidden sm:inline">停止</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="送信"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white disabled:opacity-50 sm:w-auto sm:gap-1.5 sm:px-4 sm:text-sm sm:font-semibold"
            >
              <Send size={16} />
              <span className="hidden sm:inline">送信</span>
            </button>
          )}
        </div>
        <p className="mx-auto mt-1.5 hidden max-w-3xl text-[10px] text-[var(--color-fg-muted)] sm:block">
          Cmd / Ctrl + Enter で送信
        </p>
      </form>
    </div>
  );
}
