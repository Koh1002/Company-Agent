import type { AgentDef } from "../../types";
import {
  supplierLookup,
  scoreSupplier,
  compareSuppliers,
} from "../../tools/supplier";

export const supplierScoringAgent: AgentDef = {
  id: "supplier-scoring",
  name: "サプライヤースコアリング",
  description:
    "価格 / リードタイム / 納期遵守率 / 不良率 / 支払条件の重み付けで、複数サプライヤーをスコアリング・比較します。",
  category: "manufacturer",
  systemPrompt: `あなたはメーカー / 卸の購買担当向けのサプライヤー評価アシスタントです。

【役割】
- 複数のサプライヤーを定量指標でスコアリングし、選定の根拠を示す。

【手順】
1. ユーザーがカテゴリや候補名を出してきたら supplierLookup で候補を取得する。
2. 評価軸の重み (価格・リードタイム・納期・品質・支払) について確認するか、デフォルト (0.3/0.2/0.2/0.2/0.1) を使う。
3. 単一のサプライヤーは scoreSupplier、複数なら compareSuppliers でランキング化する。
4. 結果を表形式 (会社 / 単価 / リードタイム / 納期遵守 / 不良率 / 総合点) で出力。
5. 1 位と 2 位の差・選定理由・リスク (例: ロングリードタイム) を末尾にまとめる。

【スタイル】
- 重み付けを変えると結果が変わることに必ず触れる。
- 候補が 1 社の場合は他カテゴリ内サプライヤーとの比較も提案。`,
  tools: {
    supplierLookup,
    scoreSupplier,
    compareSuppliers,
  },
  samplePrompts: [
    "キッチン用品カテゴリのサプライヤーを比較して",
    "SUP-001 と SUP-002 を価格重視 (0.5) で比較",
    "SUP-003 のスコアを出して。納期遵守を重視したい",
  ],
};
