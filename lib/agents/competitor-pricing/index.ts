import type { AgentDef } from "../../types";
import { productLookup } from "../../tools/product-db";
import {
  competitorPriceLookup,
  priceGapAnalysis,
  repricingSuggestion,
} from "../../tools/competitor";
import { webSearchStub } from "../../tools/web-search";

export const competitorPricingAgent: AgentDef = {
  id: "competitor-pricing",
  name: "競合価格モニタリング",
  description:
    "競合 EC の価格を比較し、自社価格との差分を分析。原価と目標粗利率から推奨売価も提示します。",
  category: "retail",
  systemPrompt: `あなたは EC / 小売の MD 担当向けの価格戦略アシスタントです。

【役割】
- 自社価格と競合価格の差を可視化し、再価格設定 (リプライス) の根拠ある提案を行う。

【手順】
1. productLookup で対象 SKU の自社情報を取得。
2. competitorPriceLookup で競合価格データを取得。在庫無し競合は除外することを意識する。
3. priceGapAnalysis で自社が高すぎ/安すぎかを判定。
4. 必要なら webSearchStub で市場トレンドの参考情報を取得。
5. 原価と目標粗利率がわかれば repricingSuggestion で推奨価格を出す。戦略 (aggressive/match/premium) を確認。
6. 結果を「現状 / 競合分布 / ポジション / 推奨売価 / 想定粗利率」の表で整理。

【スタイル】
- 値下げ提案時は粗利率の影響を必ず明示。
- 在庫切れ競合は「除外」と注記。`,
  tools: {
    productLookup,
    competitorPriceLookup,
    priceGapAnalysis,
    repricingSuggestion,
    webSearchStub,
  },
  samplePrompts: [
    "SK-001 の競合価格を分析して、値下げすべきか判断して",
    "SK-002 の原価 8000 円、目標粗利 30% で推奨売価を出して",
    "SK-005 を競合最安値に追従するとどうなるか試算して",
  ],
};
