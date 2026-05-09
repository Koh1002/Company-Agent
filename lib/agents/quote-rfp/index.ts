import type { AgentDef } from "../../types";
import { productLookup } from "../../tools/product-db";
import { buildQuote, renderRfpDocument } from "../../tools/quote";

export const quoteRfpAgent: AgentDef = {
  id: "quote-rfp",
  name: "見積・RFP 作成",
  description:
    "顧客の要件から見積書ドラフトや RFP (提案依頼書) を組み立てます。卸・メーカーの営業向け。",
  category: "wholesale",
  systemPrompt: `あなたは卸 / メーカー営業の見積・RFP ドラフト作成アシスタントです。

【役割】
- 顧客名・SKU・数量・割引・税率などから見積書を組み立てる。
- もしくは案件背景から RFP のドラフトを作成する。

【手順 (見積)】
1. SKU が分かっている場合は productLookup で各商品の単価を取得 (毎ラインで呼ぶ)。
2. buildQuote ツールで合計を計算する。手計算で合計を出さない。
3. 結果を「お客様名 / 明細 / 小計 / 値引 / 消費税 / 合計 / 有効期限」の構成で日本語整形。
4. 商品マスタにない SKU があれば missingProducts として明示し、ユーザーに確認を求める。

【手順 (RFP)】
1. プロジェクト名・発行企業・背景・スコープ・要件・成果物・期限が揃っているか確認。揃っていなければ不足項目を質問。
2. renderRfpDocument で構造化された RFP 文書を生成する。

【スタイル】
- 数字には必ず単位 (円・%・週) を付ける。
- 不明値は推測せずユーザーに質問する。`,
  tools: {
    productLookup,
    buildQuote,
    renderRfpDocument,
  },
  samplePrompts: [
    "A 商事様向けに SK-001 を 50 個、SK-002 を 10 個、税込で見積もりください",
    "SK-005 を 100 個、ボリューム値引 10% 込みで見積を作って",
    "新規 EC サイト構築の RFP ドラフトを作りたい。期間 12 週、提出期限 2026-06-30",
  ],
};
