import { tool } from "ai";
import { z } from "zod";

export type FaqEntry = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
};

export const FAQ: FaqEntry[] = [
  {
    id: "F-001",
    category: "返品・交換",
    question: "商品到着後、返品はできますか？",
    answer:
      "未使用品に限り、商品到着後8日以内であれば返品を承ります。お客様都合の返品送料はご負担をお願いします。",
    keywords: ["返品", "返金", "未使用", "8日"],
  },
  {
    id: "F-002",
    category: "配送",
    question: "注文から何日で届きますか？",
    answer:
      "通常、ご注文確定後2〜4営業日で発送します。離島・北海道・沖縄は追加で1〜2日かかる場合があります。",
    keywords: ["配送", "発送", "到着", "営業日"],
  },
  {
    id: "F-003",
    category: "配送",
    question: "送料はいくらですか？",
    answer:
      "全国一律660円。3,980円以上のお買い上げで送料無料となります。",
    keywords: ["送料", "無料", "3980"],
  },
  {
    id: "F-004",
    category: "支払い",
    question: "支払い方法は何が使えますか？",
    answer:
      "クレジットカード (VISA/Master/JCB/Amex)、コンビニ後払い、銀行振込、Amazon Pay に対応しています。",
    keywords: ["支払い", "決済", "クレジット", "後払い"],
  },
  {
    id: "F-005",
    category: "保証",
    question: "故障した場合の保証はありますか？",
    answer:
      "電化製品はご購入から1年間のメーカー保証付きです。保証書と納品書を添えて当社サポート窓口にご連絡ください。",
    keywords: ["保証", "故障", "修理", "メーカー保証"],
  },
  {
    id: "F-006",
    category: "在庫",
    question: "在庫切れの商品の入荷予定は？",
    answer:
      "再入荷時期はカートページ下部の「再入荷お知らせ」にご登録いただくとメールでお知らせします。通常は2〜4週間で再入荷します。",
    keywords: ["入荷", "在庫", "再入荷", "予定"],
  },
  {
    id: "F-007",
    category: "領収書",
    question: "領収書は発行できますか？",
    answer:
      "マイページの注文履歴から PDF の領収書を発行できます。宛名変更も可能です。",
    keywords: ["領収書", "PDF", "宛名"],
  },
  {
    id: "F-008",
    category: "法人取引",
    question: "法人での取引・卸売は可能ですか？",
    answer:
      "法人窓口 (corp@example.co.jp) からお問い合わせください。月間取引量に応じて卸価格でご提供します。",
    keywords: ["法人", "卸", "B2B", "取引"],
  },
];

export const faqSearch = tool({
  description:
    "FAQ ナレッジベースをキーワードで検索する。返品・配送・支払い・保証・在庫など顧客対応の根拠資料に使う。",
  inputSchema: z.object({
    query: z.string().describe("検索キーワード"),
    topK: z.number().int().min(1).max(5).default(3),
  }),
  execute: async ({ query, topK }) => {
    const q = query.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = FAQ.map((entry) => {
      const haystack = [
        entry.question,
        entry.answer,
        entry.category,
        ...entry.keywords,
      ]
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce(
        (s, t) => s + (haystack.includes(t) ? 1 : 0),
        0,
      );
      return { entry, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return {
      ok: true,
      hitCount: scored.length,
      results: scored.map((x) => ({ ...x.entry, score: x.score })),
    };
  },
});
