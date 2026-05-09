import { tool } from "ai";
import { z } from "zod";

export const formatListing = tool({
  description:
    "EC モール向けの商品ページ用に、タイトル / 箇条書き特徴 / 商品説明 / 検索キーワードを構造化して返す。最終出力前の整形に使う。",
  inputSchema: z.object({
    marketplace: z
      .enum(["rakuten", "amazon", "yahoo", "self-ec"])
      .describe("出品先モール"),
    title: z
      .string()
      .max(127)
      .describe("商品タイトル (Amazon は 80-200 字、楽天は 127 字以内が目安)"),
    bulletPoints: z.array(z.string()).min(3).max(7),
    description: z.string().describe("本文 (HTML 不可、改行のみ)"),
    keywords: z.array(z.string()).min(3).max(15),
    priceJpy: z.number().int().nonnegative().optional(),
  }),
  execute: async (input) => {
    const guidelines: Record<string, { titleMax: number; bullets: number }> = {
      rakuten: { titleMax: 127, bullets: 5 },
      amazon: { titleMax: 200, bullets: 5 },
      yahoo: { titleMax: 75, bullets: 5 },
      "self-ec": { titleMax: 100, bullets: 5 },
    };
    const g = guidelines[input.marketplace];
    const warnings: string[] = [];
    if (input.title.length > g.titleMax) {
      warnings.push(
        `タイトルが ${input.marketplace} の推奨上限 ${g.titleMax} 字を超えています (${input.title.length} 字)`,
      );
    }
    if (input.bulletPoints.length > g.bullets) {
      warnings.push(
        `${input.marketplace} の推奨は箇条書き ${g.bullets} 件以内 (現在 ${input.bulletPoints.length} 件)`,
      );
    }
    return {
      ok: true,
      marketplace: input.marketplace,
      listing: {
        title: input.title,
        bulletPoints: input.bulletPoints,
        description: input.description,
        keywords: input.keywords,
        priceJpy: input.priceJpy,
      },
      warnings,
    };
  },
});
