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
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)] p-2">
              <Bot size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Company Agent
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-fg-muted)]">
            メーカー・卸・小売の業務を AI エージェントで代替するためのプラットフォーム。
            Vercel AI SDK のツールコール + ReAct ループで動作します。
          </p>
        </div>
        {hasCreds && providerLabel && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
            <ShieldCheck size={14} /> 接続: {providerLabel}
          </div>
        )}
      </header>

      <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            2. エージェントを選ぶ
          </h2>
          {hasCreds === false && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-200">
              先に左の入力欄から資格情報を保存してください。各エージェントのチャット画面で
              ブラウザ → API ルートにヘッダ経由で送信されます。
            </div>
          )}
          {hasCreds && (
            <div className="space-y-6">
              {(Object.keys(grouped) as AgentCategory[]).map((cat) => (
                <div key={cat}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
                    {CATEGORY_LABEL[cat]}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

      <footer className="mt-16 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-fg-muted)]">
        <p>
          後続のエージェント候補: 詳細需要計画 / 自動補充発注 / サプライヤースコアリング /
          棚割り提案 / クレームトリアージ / 契約書レビュー / 議事録生成 / 競合価格モニタリング
          / 倉庫 KPI 対話 / 新商品コンセプト / 出荷遅延原因分析 / 採用スクリーニング /
          経費仕訳 / 営業日報生成 — registry に追加するだけで増やせます。
        </p>
      </footer>
    </div>
  );
}
