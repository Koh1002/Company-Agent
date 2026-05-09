import { tool } from "ai";
import { z } from "zod";

export const formatReply = tool({
  description:
    "日本語ビジネスメールの定型 (宛名・冒頭挨拶・結びの文・署名) を組み立てて返す。本文ドラフトと組み合わせて使う。",
  inputSchema: z.object({
    recipientName: z.string().describe("宛先 (例: 山田 様)"),
    senderName: z.string().describe("差出人氏名"),
    senderCompany: z.string().describe("差出人会社名"),
    subject: z.string().describe("件名"),
    body: z.string().describe("本文 (中身。挨拶や結びは含めない)"),
    tone: z
      .enum(["polite", "formal", "casual"])
      .default("polite")
      .describe("文体: polite (通常) / formal (より硬め) / casual (社内向け)"),
  }),
  execute: async ({
    recipientName,
    senderName,
    senderCompany,
    subject,
    body,
    tone,
  }) => {
    const greeting =
      tone === "formal"
        ? "拝啓 平素より格別のご高配を賜り、誠にありがとうございます。"
        : tone === "casual"
          ? "お世話になっております。"
          : "いつもお世話になっております。";
    const closing =
      tone === "formal"
        ? "今後とも変わらぬお引き立てを賜りますようお願い申し上げます。\n敬具"
        : tone === "casual"
          ? "引き続きよろしくお願いします。"
          : "引き続きどうぞよろしくお願いいたします。";
    const signature = `${senderCompany}\n${senderName}`;
    const composed = `件名: ${subject}

${recipientName}

${greeting}

${body}

${closing}

${signature}`;
    return { ok: true, email: composed };
  },
});

export const summarizeInquiry = tool({
  description:
    "受信メール本文から要点 (依頼・質問・期限・優先度) を構造化抽出する。返信ドラフト前の整理に使う。",
  inputSchema: z.object({
    inquiry: z.string().describe("受信メール本文"),
  }),
  execute: async ({ inquiry }) => {
    const lower = inquiry.toLowerCase();
    const urgency =
      /緊急|至急|asap|今日中|本日/.test(inquiry) ? "high"
      : /できるだけ早く|早めに/.test(inquiry) ? "medium"
      : "normal";
    const intent =
      /返品|交換/.test(inquiry) ? "return"
      : /見積|価格/.test(inquiry) ? "quote"
      : /配送|発送|納期/.test(inquiry) ? "delivery"
      : /故障|不具合/.test(inquiry) ? "defect"
      : /キャンセル/.test(inquiry) ? "cancel"
      : "other";
    return {
      ok: true,
      length: inquiry.length,
      urgency,
      intent,
      hasAttachmentRef: /添付|資料/.test(inquiry),
      mentionsOrderNumber: /注文番号|order ?#?\s?\d+/i.test(lower),
    };
  },
});
