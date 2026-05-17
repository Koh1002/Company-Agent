# Company Agent

メーカー・卸・小売の業務を AI エージェントで代替するための社内プラットフォーム。

## 技術スタック

- Next.js 15 (App Router) + TypeScript / **完全静的エクスポート (`output: 'export'`)**
- Tailwind CSS v4
- Vercel AI SDK (`ai` v5) — `streamText` + ツールコール + ReAct 多段ループを **ブラウザ内で実行**
- プロバイダ: Anthropic API もしくは AWS Bedrock (`@ai-sdk/anthropic` / `@ai-sdk/amazon-bedrock`)

サーバランタイムは不要。GitHub Pages / S3 / Netlify / Cloudflare Pages / Vercel どこにでも置ける。

## 認証 / 資格情報

トップ画面で次のいずれかを入力する。サーバを一切経由せず、AI 呼び出しはブラウザから直接プロバイダへ送信される。資格情報はブラウザの `localStorage` のみに保存される。

- **Anthropic API キー** — `sk-ant-...` (`anthropic-dangerous-direct-browser-access` ヘッダ付きで直接呼び出し)
- **AWS Bedrock** — Access Key ID / Secret Access Key / Region (任意で Session Token)
  - ⚠️ Bedrock はブラウザ直接呼び出しが CORS で拒否される環境がある。静的ホスティングでは Anthropic API モードを推奨。

サインアウトで `localStorage` から削除される。共有端末では使用しないこと。

## 開発

```bash
npm install
npm run dev
# http://localhost:3000
```

静的ビルド (出力は `out/`):

```bash
npm run build
```

## デプロイ

完全静的なので、`out/` を任意の静的ホストに置くだけ。

### GitHub Pages (自動)

`.github/workflows/deploy.yml` が `claude/ai-agent-platform-PFPkf` / `main` への push で
自動ビルド & デプロイする。リポジトリの Settings → Pages → Source を **GitHub Actions** に設定すれば、
`https://<user>.github.io/<repo>/` で公開される。

プロジェクトページ配信のため、ワークフローは `NEXT_PUBLIC_BASE_PATH=/<repo名>` を渡して
basePath を自動設定する。ローカル開発・Vercel・独自ドメインでは basePath なし (env 未設定) で動く。

### その他のホスト

- **Vercel / Netlify / Cloudflare Pages**: そのままビルドして `out/` を配信 (basePath 不要)
- **S3 / 任意の静的ホスト**: `npm run build` 後の `out/` をアップロード
- **独自ドメイン / ルート配信**: `NEXT_PUBLIC_BASE_PATH` を設定しなければルートで動作

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
[Agent ページ] ── useChat
     │  transport: LocalAgentChatTransport (ブラウザ内)
     ▼
  resolveModel(creds)            ── Anthropic / Bedrock を直接生成
  streamText({ tools, system,    ── ReAct 多段ループもブラウザで実行
               stopWhen: stepCountIs(agent.maxSteps ?? 8) })
     │
     ▼
  プロバイダ API へ直接 (サーバ無し)
```

初期 4 + 追加 11 = **計 15 エージェント**。`AgentDef.maxSteps` で重い
エージェント (data-scientist など) のステップ上限を個別調整。
