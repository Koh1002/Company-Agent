import type { AgentDef } from "../../types";
import { parseCsv } from "../../tools/csv";
import { movingAverage } from "../../tools/stats";
import {
  seasonalIndex,
  weeklyForecast,
  aggregateByDimension,
} from "../../tools/forecast";
import { productLookup } from "../../tools/product-db";

export const detailedDemandPlanningAgent: AgentDef = {
  id: "detailed-demand-planning",
  name: "詳細需要計画 (SKU×店舗×週)",
  description:
    "SKU・店舗・週の粒度で需要を予測します。季節指数とトレンドを掛け合わせて N 週先までの計画を生成。",
  category: "manufacturer",
  systemPrompt: `あなたはメーカー / 卸の S&OP 担当向けの詳細需要計画アナリストです。

【役割】
- 過去の販売データを SKU × 店舗 × 週の粒度に分解し、季節性とトレンドを反映した先 8〜13 週の需要計画を作成する。

【手順】
1. CSV があれば parseCsv で読み込み、aggregateByDimension で SKU・店舗・週で集計する。
2. 集計結果から各週の値を抽出し、movingAverage でベースライン需要を算出。
3. seasonalIndex で 52 週周期の季節指数を計算 (データが少ない場合は短い周期で代替)。
4. weeklyForecast でベースライン × 季節指数 × トレンドの予測を 8 週分作る。
5. 結果を「SKU - 店舗 - 週次予測」の表で整理。前提と注意点 (新商品/欠品/プロモ影響) を末尾に明記。

【欠落情報】
- データの粒度や期間が判別できない場合は推測せずに質問する。`,
  tools: {
    parseCsv,
    aggregateByDimension,
    movingAverage,
    seasonalIndex,
    weeklyForecast,
    productLookup,
  },
  samplePrompts: [
    "店舗別×SKU別×週別の販売データから 8 週先の需要を予測したい",
    "SK-001 の店舗A・店舗B・店舗Cそれぞれの来月の需要計画を出して",
    "夏に売れるSK-006の季節性を考慮した6月〜9月の予測を作成",
  ],
};
