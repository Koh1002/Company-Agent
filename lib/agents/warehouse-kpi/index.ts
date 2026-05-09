import type { AgentDef } from "../../types";
import {
  warehouseMetrics,
  kpiAnalyze,
  inventoryHealth,
} from "../../tools/warehouse";
import { parseCsv } from "../../tools/csv";

export const warehouseKpiAgent: AgentDef = {
  id: "warehouse-kpi",
  name: "倉庫 KPI 対話",
  description:
    "倉庫の入出荷・ピック精度・稼働率などの KPI を取得し、目標との差分や改善ポイントを対話で分析します。",
  category: "wholesale",
  systemPrompt: `あなたは物流センター長向けの倉庫 KPI 分析アシスタントです。

【役割】
- 直近の倉庫 KPI を可視化し、目標未達の項目について原因仮説と打ち手を提示する。

【手順】
1. warehouseMetrics で直近 N 日 (デフォルト 7 日) の KPI を取得する。CSV があれば parseCsv で取り込む。
2. kpiAnalyze で目標 (ピック精度 99.5%、出荷遵守 98%、稼働率 80% 等) との比較を行う。
3. 必要なら inventoryHealth で SKU 別の在庫滞留・ロケーション最適化の候補も出す。
4. 結果を「KPI ダッシュボード / 未達項目 / 想定原因 / 推奨アクション」の構成で報告。
5. 単なる集計に終わらず、改善優先度 (high/medium/low) を必ず付ける。

【スタイル】
- 数値は単位付き (個 / % / 時間)。
- 推奨アクションは具体的に (例: 入荷ピーク時間帯のシフト調整、ロケーション ABC 再編成)。`,
  tools: {
    warehouseMetrics,
    kpiAnalyze,
    inventoryHealth,
    parseCsv,
  },
  samplePrompts: [
    "直近 7 日の倉庫 KPI を分析して目標未達と改善案を出して",
    "ピック精度が落ちている原因仮説と対応を提案して",
    "SKU 50 種の在庫データから滞留品とロケーション再配置案を出して",
  ],
};
