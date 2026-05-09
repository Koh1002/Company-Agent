import { tool } from "ai";
import { z } from "zod";

export const extractActionItems = tool({
  description:
    "会議の文字起こしから ToDo (アクションアイテム) を抽出する。担当者・期日・内容を構造化。",
  inputSchema: z.object({
    transcript: z.string().min(20),
  }),
  execute: async ({ transcript }) => {
    const sentences = transcript
      .split(/[。\n]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const items: {
      sentence: string;
      assignee?: string;
      dueDate?: string;
      verb?: string;
    }[] = [];
    const verbPattern = /(対応|確認|送付|作成|連絡|準備|検討|提出|共有|調整|手配|決定)する|までに/;
    const datePattern =
      /(\d{4}\s*[\/\-年]\s*\d{1,2}\s*[\/\-月]\s*\d{1,2}\s*日?|\d{1,2}\s*[\/\-月]\s*\d{1,2}\s*日?|来週|来月|今週|今月末|月末)/;
    const assigneePattern = /([一-龥ァ-ヶ]{1,4})\s*(?:さん|氏|くん|部長|課長|マネージャー|担当)/;
    for (const s of sentences) {
      if (!verbPattern.test(s)) continue;
      const dueMatch = s.match(datePattern);
      const assigneeMatch = s.match(assigneePattern);
      const verbMatch = s.match(verbPattern);
      items.push({
        sentence: s,
        assignee: assigneeMatch?.[1],
        dueDate: dueMatch?.[1],
        verb: verbMatch?.[0],
      });
    }
    return { ok: true, count: items.length, items };
  },
});

export const structureMinutes = tool({
  description:
    "議事録のテキストを「議題 / 議論 / 決定事項 / 持ち帰り」に分類して構造化する。セクション見出しは推測する。",
  inputSchema: z.object({
    transcript: z.string().min(20),
    meetingTitle: z.string().optional(),
    date: z.string().optional(),
    attendees: z.array(z.string()).optional(),
  }),
  execute: async ({ transcript, meetingTitle, date, attendees }) => {
    const sentences = transcript
      .split(/[。\n]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const decisions: string[] = [];
    const discussions: string[] = [];
    const carryOver: string[] = [];
    const topics: string[] = [];
    for (const s of sentences) {
      if (/(決定|決まり|承認|approved|合意)/.test(s)) decisions.push(s);
      else if (/(持ち帰り|後日|次回|宿題|ペンディング)/.test(s)) carryOver.push(s);
      else if (/(議題|アジェンダ|テーマ)/.test(s)) topics.push(s);
      else if (s.length > 8) discussions.push(s);
    }
    return {
      ok: true,
      header: { meetingTitle, date, attendees },
      topics: topics.slice(0, 10),
      discussionsCount: discussions.length,
      decisions,
      carryOver,
      summarySentences: discussions.slice(0, 5),
    };
  },
});

export const renderMinutesMarkdown = tool({
  description:
    "整形済みの議事録 Markdown を生成する。LLM が抽出した要素を入れる先のテンプレ。",
  inputSchema: z.object({
    title: z.string(),
    date: z.string(),
    attendees: z.array(z.string()).default([]),
    agenda: z.array(z.string()).default([]),
    discussions: z.array(z.string()).default([]),
    decisions: z.array(z.string()).default([]),
    actionItems: z
      .array(
        z.object({
          item: z.string(),
          owner: z.string().optional(),
          due: z.string().optional(),
        }),
      )
      .default([]),
    nextMeeting: z.string().optional(),
  }),
  execute: async (i) => {
    const md = [
      `# ${i.title}`,
      `**日時**: ${i.date}  `,
      i.attendees.length ? `**出席者**: ${i.attendees.join(", ")}` : null,
      `\n## アジェンダ\n${i.agenda.map((a) => `- ${a}`).join("\n") || "- (未指定)"}`,
      `\n## 議論内容\n${i.discussions.map((d) => `- ${d}`).join("\n") || "- (記載なし)"}`,
      `\n## 決定事項\n${i.decisions.map((d) => `- ${d}`).join("\n") || "- (記載なし)"}`,
      `\n## アクションアイテム\n${
        i.actionItems
          .map(
            (a) =>
              `- [ ] ${a.item}${a.owner ? ` (担当: ${a.owner})` : ""}${a.due ? ` / 期日: ${a.due}` : ""}`,
          )
          .join("\n") || "- (なし)"
      }`,
      i.nextMeeting ? `\n## 次回\n${i.nextMeeting}` : null,
    ].filter(Boolean);
    return { ok: true, markdown: md.join("\n") };
  },
});
