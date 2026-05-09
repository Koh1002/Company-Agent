import { tool } from "ai";
import { z } from "zod";
import { findProductBySku } from "./product-db";

export type CompetitorListing = {
  sku: string;
  competitor: string;
  url: string;
  priceJpy: number;
  inStock: boolean;
  observedAt: string;
};

export const COMPETITOR_LISTINGS: CompetitorListing[] = [
  { sku: "SK-001", competitor: "ライバル A 楽天店", url: "https://example.com/a/sk-001", priceJpy: 1380, inStock: true, observedAt: "2026-05-08" },
  { sku: "SK-001", competitor: "Amazon 同型品", url: "https://example.com/amzn/sk-001", priceJpy: 1520, inStock: true, observedAt: "2026-05-08" },
  { sku: "SK-001", competitor: "Yahoo 系列", url: "https://example.com/yh/sk-001", priceJpy: 1430, inStock: false, observedAt: "2026-05-07" },
  { sku: "SK-002", competitor: "家電量販 EC", url: "https://example.com/dk/sk-002", priceJpy: 12480, inStock: true, observedAt: "2026-05-08" },
  { sku: "SK-002", competitor: "並行輸入店", url: "https://example.com/par/sk-002", priceJpy: 11800, inStock: true, observedAt: "2026-05-06" },
  { sku: "SK-005", competitor: "健康食品 EC A", url: "https://example.com/ha/sk-005", priceJpy: 4180, inStock: true, observedAt: "2026-05-08" },
  { sku: "SK-005", competitor: "健康食品 EC B", url: "https://example.com/hb/sk-005", priceJpy: 4500, inStock: true, observedAt: "2026-05-08" },
  { sku: "SK-006", competitor: "スポーツショップ 楽天", url: "https://example.com/sp/sk-006", priceJpy: 3480, inStock: true, observedAt: "2026-05-08" },
  { sku: "SK-007", competitor: "家電 EC X", url: "https://example.com/ex/sk-007", priceJpy: 5380, inStock: true, observedAt: "2026-05-07" },
];

export const competitorPriceLookup = tool({
  description:
    "競合 EC の価格モニタリング DB から、対象 SKU に対する競合価格一覧を取得する (在庫状況・観測日時付き)。",
  inputSchema: z.object({
    sku: z.string(),
  }),
  execute: async ({ sku }) => {
    const listings = COMPETITOR_LISTINGS.filter(
      (l) => l.sku.toLowerCase() === sku.toLowerCase(),
    );
    const product = findProductBySku(sku);
    if (listings.length === 0) {
      return {
        found: false,
        sku,
        ourPrice: product?.unitPrice,
        message: "競合情報なし",
      };
    }
    const prices = listings.map((l) => l.priceJpy);
    return {
      found: true,
      sku,
      ourPrice: product?.unitPrice,
      productName: product?.name,
      listings,
      stats: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      },
    };
  },
});

export const priceGapAnalysis = tool({
  description:
    "自社価格と競合の最低/平均価格との差分を可視化する。値下げ余地・優位幅を判定。",
  inputSchema: z.object({
    sku: z.string(),
    ourPrice: z.number().positive().optional().describe("省略時は商品マスタ価格を使う"),
  }),
  execute: async ({ sku, ourPrice }) => {
    const product = findProductBySku(sku);
    const listings = COMPETITOR_LISTINGS.filter(
      (l) => l.sku.toLowerCase() === sku.toLowerCase() && l.inStock,
    );
    const ours = ourPrice ?? product?.unitPrice;
    if (!ours) return { ok: false, message: "自社価格が不明" };
    if (listings.length === 0)
      return { ok: false, message: "在庫ありの競合が無いため比較不能" };
    const prices = listings.map((l) => l.priceJpy);
    const min = Math.min(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const vsMin = ours - min;
    const vsAvg = ours - avg;
    const position =
      ours <= min ? "lowest" : ours <= avg ? "below-avg" : "above-avg";
    return {
      ok: true,
      sku,
      ourPrice: ours,
      competitorMin: min,
      competitorAvg: avg,
      diffVsMin: vsMin,
      diffVsAvg: vsAvg,
      position,
      undercutSuggestionJpy:
        position === "above-avg" ? Math.max(0, vsMin + 1) : 0,
    };
  },
});

export const repricingSuggestion = tool({
  description:
    "目標粗利率と原価から推奨売価を算出し、競合最低価格との差を考慮した価格戦略 (積極追従/維持/プレミアム) を提案する。",
  inputSchema: z.object({
    sku: z.string(),
    cogs: z.number().positive().describe("原価 (円)"),
    targetMarginPct: z.number().min(0).max(90).default(30),
    strategy: z
      .enum(["aggressive", "match", "premium"])
      .default("match"),
  }),
  execute: async ({ sku, cogs, targetMarginPct, strategy }) => {
    const product = findProductBySku(sku);
    const listings = COMPETITOR_LISTINGS.filter(
      (l) => l.sku.toLowerCase() === sku.toLowerCase() && l.inStock,
    );
    const competitorMin =
      listings.length > 0 ? Math.min(...listings.map((l) => l.priceJpy)) : null;
    const minimumPrice = Math.ceil(cogs / (1 - targetMarginPct / 100));
    let suggested = minimumPrice;
    if (competitorMin) {
      if (strategy === "aggressive") {
        suggested = Math.max(minimumPrice, competitorMin - 50);
      } else if (strategy === "match") {
        suggested = Math.max(minimumPrice, competitorMin);
      } else {
        suggested = Math.max(minimumPrice, Math.round(competitorMin * 1.07));
      }
    }
    const realizedMargin = ((suggested - cogs) / suggested) * 100;
    return {
      ok: true,
      sku,
      productName: product?.name,
      currentPrice: product?.unitPrice,
      cogs,
      targetMarginPct,
      strategy,
      competitorMin,
      minimumPrice,
      suggestedPrice: suggested,
      realizedMarginPct: Math.round(realizedMargin * 10) / 10,
    };
  },
});
