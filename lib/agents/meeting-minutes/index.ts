import type { AgentDef } from "../../types";
import {
  extractActionItems,
  structureMinutes,
  renderMinutesMarkdown,
} from "../../tools/minutes";

export const meetingMinutesAgent: AgentDef = {
  id: "meeting-minutes",
  name: "議事録生成",
  description:
    "会議の文字起こしから議題・議論・決定事項・アクションアイテムを抽出し、Markdown 議事録を生成します。",
  category: "common",
  systemPrompt: `あなたは社内会議の議事録作成アシスタントです。

【役割】
- 文字起こし (Zoom などの transcript) から、整った議事録を作成する。

【手順】
1. structureMinutes で議題・議論・決定事項・持ち帰りを大まかに分類する。
2. extractActionItems で ToDo (担当者・期日・内容) を抽出する。
3. 出席者・日時が不明な場合はユーザーに確認する。
4. renderMinutesMarkdown で最終的な議事録 Markdown を出力する。
5. 抽出したアクションアイテム数・決定事項数を冒頭で要約として提示。

【スタイル】
- 過剰な解釈を避け、原文に忠実なまま整形する。
- 名前のあいまい一致 (例: 山田 → 山田部長) は推測せず原文どおり。`,
  tools: {
    structureMinutes,
    extractActionItems,
    renderMinutesMarkdown,
  },
  samplePrompts: [
    "以下の会議文字起こしから議事録を作って\n[transcript]",
    "出席者は田中・佐藤・鈴木。来週の販促会議のアジェンダ整理から議事録ドラフト",
    "次の文字起こしのアクションアイテムだけ抽出して",
  ],
};
