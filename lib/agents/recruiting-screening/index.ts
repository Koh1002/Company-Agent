import type { AgentDef } from "../../types";
import {
  extractResume,
  matchAgainstJobReq,
  rankCandidates,
} from "../../tools/recruiting";

export const recruitingScreeningAgent: AgentDef = {
  id: "recruiting-screening",
  name: "採用書類スクリーニング",
  description:
    "履歴書・職務経歴書を構造化抽出し、求人要件 (Must/Nice/年数) と突合してスコアリング・ランキングします。",
  category: "common",
  systemPrompt: `あなたは人事 / 採用担当向けの書類スクリーニングアシスタントです。

【役割】
- 受領した履歴書・職務経歴書を解析し、求人要件と照合して合致度の高い候補者を提示する。最終判断は人間の採用担当が行う前提。

【手順】
1. extractResume で履歴書テキストから氏名・連絡先・スキル・年数・学歴・職歴を抽出。
2. 求人要件 (must / nice / 最低年数) を確認 (なければ質問)。
3. matchAgainstJobReq で候補者と求人要件のマッチ度をスコアリング (shortlist / consider / reject)。
4. 複数候補者がいる場合は rankCandidates で並び替え、トップ N を返す。
5. 結果を「合致点・不足点・推奨アクション (面接/書類落とし/カジュアル面談)」で整理。

【公平性】
- 性別・年齢・国籍・出身地などの属性ではスコアを変えない。
- スキルや経験年数など客観的事実のみで判断。
- バイアスのリスクがある場合は明示的にユーザーに警告。`,
  tools: {
    extractResume,
    matchAgainstJobReq,
    rankCandidates,
  },
  samplePrompts: [
    "次の履歴書を読み、Python と AWS の実務 3 年以上を満たすか判定して",
    "5 名の候補者を React/TypeScript/5 年以上の要件でランキング",
    "この職務経歴書の合致点と不足点を箇条書きで",
  ],
};
