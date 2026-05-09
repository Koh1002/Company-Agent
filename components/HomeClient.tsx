"use client";

import { useEffect, useState } from "react";
import { Bot, ShieldCheck } from "lucide-react";
import { CredentialForm } from "./CredentialForm";
import { AgentCard } from "./AgentCard";
import { loadCredentials } from "@/lib/credentials";
import type { AgentMetadata } from "@/lib/agents/metadata";
import { CATEGORY_LABEL } from "@/lib/agents/metadata";
import type { AgentCategory } from "@/lib/types";

export function HomeClient({ agents }: { agents: AgentMetadata[] }) {
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [providerLabel, setProviderLabel] = useState<string>("");

  useEffect(() => {
    const c = loadCredentials();
    setHasCreds(!!c);
    if (c) {
      setProviderLabel(
        c.mode === "anthropic" ? "Anthropic API" : `AWS Bedrock (${c.region})`,
      );
    }
  }, []);

  const grouped = agents.reduce<Record<AgentCategory, AgentMetadata[]>>(
    (acc, a) => {
      (acc[a.category] ||= []).push(a);
      return acc;
    },
    {} as Record<AgentCategory, AgentMetadata[]>,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] p-2">
              <Bot size={20} className="text-white sm:hidden" />
              <Bot size={22} className="hidden text-white sm:block" />
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Company Agent
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--color-fg-muted)] sm:text-sm">
            メーカー・卸・小売の業務を AI エージェントで代替するためのプラットフォーム。
            Vercel AI SDK のツールコール + ReAct ループで動作します。
          </p>
        </div>
        {hasCreds && providerLabel && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200 sm:px-3 sm:py-1.5 sm:text-xs">
            <ShieldCheck size={14} />
            <span className="truncate">接続: {providerLabel}</span>
          </div>
        )}
      </header>

      <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] sm:text-sm">
            1. 資格情報を入力
          </h2>
          <CredentialForm
            onSaved={(c) => {
              setHasCreds(true);
              setProviderLabel(
                c.mode === "anthropic"
                  ? "Anthropic API"
                  : `AWS Bedrock (${c.region})`,
              );
            }}
          />
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)] sm:text-sm">
            2. エージェントを選ぶ
          </h2>
          {hasCreds === false && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200 sm:p-5">
              先に上の入力欄から資格情報を保存してください。各エージェントのチャット画面で
              ブラウザ → API ルートにヘッダ経由で送信されます。
            </div>
          )}
          {hasCreds && (
            <div className="space-y-5 sm:space-y-6">
              {(Object.keys(grouped) as AgentCategory[]).map((cat) => (
                <div key={cat}>
                  <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-fg-muted)] sm:text-xs">
                    {CATEGORY_LABEL[cat]}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {grouped[cat].map((a) => (
                      <AgentCard key={a.id} agent={a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-10 border-t border-[var(--color-border)] pt-6 text-[11px] leading-relaxed text-[var(--color-fg-muted)] sm:mt-16 sm:text-xs">
        <p>
          後続のエージェント候補 (未実装): クレームトリアージ / 出荷遅延原因分析 /
          経費仕訳・経費精算 / 営業日報生成 / 新商品コンセプト生成 / 与信調査 /
          配送計画・配車 / SNS 投稿生成 / カタログ自動生成 / プライシング戦略シミュレータ
          / 顧客解約予測 — registry に追加するだけで増やせます。
        </p>
      </footer>
    </div>
  );
}
