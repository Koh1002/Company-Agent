# Company Agent

メーカー・卸・小売の業務を AI エージェントで代替するための社内プラットフォーム。

## 技術スタック

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Vercel AI SDK (`ai` v5) — `streamText` + ツールコール + ReAct 多段ループ
- プロバイダ: Anthropic API もしくは AWS Bedrock (`@ai-sdk/anthropic` / `@ai-sdk/amazon-bedrock`)

## 認証 / 資格情報

トップ画面で次のいずれかを入力する。サーバ側には永続化されず、ブラウザの `localStorage` のみに保存される。

- **Anthropic API キー** — `sk-ant-...`
- **AWS Bedrock** — Access Key ID / Secret Access Key / Region (任意で Session Token)

サインアウトで `localStorage` から削除される。共有端末では使用しないこと。

## 開発

```bash
npm install
npm run dev
# http://localhost:3000
```

ビルド:

```bash
npm run build
```

## 初期エージェント

| ID | 名称 | 想定業務 |
|---|---|---|
| `ec-listing` | 商品説明文 / EC 出品文生成 | 小売・EC |
| `demand-forecast` | 需要予測・発注提案 | メーカー・卸 |
| `quote-rfp` | 見積 / RFP 作成 | 卸・メーカー営業 |
| `inquiry-reply` | 問い合わせ / メール返信 | 共通 |

## エージェントの追加方法

1. `lib/agents/<id>/index.ts` で `AgentDef` を export
2. `lib/agents/registry.ts` に 1 行追加
3. 必要なら `lib/tools/` にツールを追加

## アーキテクチャ概要

```
[Top Screen] ── localStorage に creds 保存
     ↓
[Agent ページ] ── useChat ──► [/api/chat/[agentId]]
                                       │
                                       ├─ resolveModel(headers)
                                       │    Anthropic / Bedrock
                                       └─ streamText({ tools, system, stopWhen: stepCountIs(8) })
```
