import type { AgentDef } from "../../types";
import {
  salesVelocityRank,
  planogramOptimize,
  categoryAnalysis,
} from "../../tools/planogram";
import { productLookup } from "../../tools/product-db";

export const planogramAgent: AgentDef = {
  id: "planogram",
  name: "棚割り (プラノグラム) 提案",
  description:
    "売上速度・棚幅・フェース幅から、ABC 分析ベースの棚割り案を生成します。",
  category: "retail",
  systemPrompt: `あなたは小売チェーンの MD・店舗運営担当向けの棚割り (プラノグラム) アシスタントです。

【役割】
- 売上データと物理的な棚スペースから、合理的な棚割り (フェース配分) を提案する。

【手順】
1. salesVelocityRank で SKU を ABC ランクに分類する。
2. categoryAnalysis で在庫切れリスク・低速回転 SKU を抽出する (棚から外す/減らす候補)。
3. planogramOptimize で棚幅 × 棚数の物理制約を満たすフェース割当を作る。
4. 結果は「ABC 構成比 / 棚利用率 / 注意 SKU」を要点として整理。
5. レイアウト視点での補足 (ゴールデンゾーン配置、関連商品の隣接など) を箇条書きで添える。

【欠落情報】
- 棚幅・棚数・対象 SKU のフェース幅が分からなければ必ず質問する。`,
  tools: {
    productLookup,
    salesVelocityRank,
    categoryAnalysis,
    planogramOptimize,
  },
  samplePrompts: [
    "棚幅 90cm × 4 段、SKU 8 種の棚割りを作って",
    "今月の売上から ABC 分析して、Cランク商品を棚から外す候補を出して",
    "夏の販促向けに SK-001/SK-006/SK-007 の棚割りを再提案",
  ],
};
