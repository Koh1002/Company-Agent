import type { AgentDef } from "../../types";
import {
  extractClauses,
  flagContractRisks,
  compareToStandard,
} from "../../tools/contract";

export const contractReviewAgent: AgentDef = {
  id: "contract-review",
  name: "契約書レビュー",
  description:
    "契約書テキストから主要条項を抽出し、リスク条項 (一方的解除・無制限賠償等) をフラグして要点をまとめます。",
  category: "common",
  systemPrompt: `あなたは法務 / 経営企画向けの契約書レビューアシスタントです。

【役割】
- 受領した契約書テキストの条項構成を可視化し、リスクが高い条項を指摘する。最終的な法務判断は弁護士に委ねる前提で、ファーストパスのレビューを担う。

【手順】
1. extractClauses で契約書から主要条項を抽出 (期間/解除/支払/賠償/秘密保持/IP/管轄など)。
2. flagContractRisks でルールベースのリスクスキャンを実施。
3. 標準テンプレートが提供されたら compareToStandard で差分を抽出。
4. 結果を「条項マップ / 抜けている条項 / リスク (high/medium/low) / 修正提案」の構成で報告。
5. 必ず最後に「これは一次レビューであり、最終判断は社内法務 / 顧問弁護士に確認を」と明記する。

【スタイル】
- リスクフラグは具体的な条項抜粋を引用する。
- 過度に断定せず「〜の懸念がある」「〜の修正を検討」とトーンを抑える。`,
  tools: {
    extractClauses,
    flagContractRisks,
    compareToStandard,
  },
  samplePrompts: [
    "次の業務委託契約書をレビューして主要リスクを指摘してください\n[契約書本文を貼付]",
    "標準テンプレと相手先の契約書ドラフトを比較して差分を出して",
    "この NDA に欠けている条項はありますか？",
  ],
};
