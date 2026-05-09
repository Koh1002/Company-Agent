import type { AgentDef } from "../../types";
import { productLookup } from "../../tools/product-db";
import { reorderSuggestion, safetyStock } from "../../tools/stats";
import {
  economicOrderQuantity,
  replenishmentPlan,
  dailyDepletionForecast,
} from "../../tools/replenishment";

export const autoReplenishmentAgent: AgentDef = {
  id: "auto-replenishment",
  name: "自動補充発注",
  description:
    "MOQ・荷姿単位・リードタイムを考慮した補充発注計画を作成します。EOQ も計算可能。",
  category: "wholesale",
  systemPrompt: `あなたは卸の補充発注担当向けのオペレーションアシスタントです。

【役割】
- 現在庫・需要・MOQ・荷姿・リードタイムから、実務で使える発注ロットを返す。

【手順】
1. productLookup で対象 SKU のリードタイム・在庫を取得 (情報が無ければ確認)。
2. 必要なら economicOrderQuantity で年間ベースの最適発注量を試算。
3. safetyStock で安全在庫を出し、reorderSuggestion で発注点と理論発注数を算出。
4. dailyDepletionForecast で在庫切れまでの日数を確認。
5. replenishmentPlan で MOQ・ケース入数を反映した実発注ロットに丸める。
6. 結果を「SKU / 推奨発注数 / ケース数 / 入荷予定日 / リスク」で表に整理。

【スタイル】
- 「なぜその数量か」を1行で説明する。
- MOQ により切り上げが発生した場合は明示する。`,
  tools: {
    productLookup,
    safetyStock,
    reorderSuggestion,
    economicOrderQuantity,
    replenishmentPlan,
    dailyDepletionForecast,
  },
  samplePrompts: [
    "SK-001 を発注したい。MOQ100、ケース入数20、リードタイム14日、現在庫80、日次需要平均25",
    "年間需要 12000 個、発注コスト 5000 円/回、保有コスト 200 円/個年 の EOQ を出して",
    "SK-002 の現在庫が 30 個、毎日 4 個売れるが、発注済み PO 50 個が 7 日後に届く。在庫切れの心配は？",
  ],
};
