import { tool } from "ai";
import { z } from "zod";

export type Supplier = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  leadTimeDays: number;
  onTimeDeliveryRate: number;
  defectRatePct: number;
  paymentTermsDays: number;
  minOrderJpy: number;
  countryOfOrigin: string;
  certifications: string[];
};

export const SUPPLIERS: Supplier[] = [
  {
    id: "SUP-001",
    name: "山田製作所",
    category: "キッチン用品",
    unitPrice: 980,
    leadTimeDays: 14,
    onTimeDeliveryRate: 0.97,
    defectRatePct: 0.4,
    paymentTermsDays: 30,
    minOrderJpy: 200000,
    countryOfOrigin: "日本",
    certifications: ["ISO 9001"],
  },
  {
    id: "SUP-002",
    name: "Pacific Trading",
    category: "キッチン用品",
    unitPrice: 720,
    leadTimeDays: 35,
    onTimeDeliveryRate: 0.88,
    defectRatePct: 1.2,
    paymentTermsDays: 60,
    minOrderJpy: 500000,
    countryOfOrigin: "ベトナム",
    certifications: ["ISO 9001"],
  },
  {
    id: "SUP-003",
    name: "AudioWave Co.",
    category: "オーディオ",
    unitPrice: 6800,
    leadTimeDays: 21,
    onTimeDeliveryRate: 0.94,
    defectRatePct: 0.8,
    paymentTermsDays: 45,
    minOrderJpy: 1000000,
    countryOfOrigin: "中国",
    certifications: ["ISO 9001", "ISO 14001"],
  },
  {
    id: "SUP-004",
    name: "Organic Cotton House",
    category: "ベビー用品",
    unitPrice: 1450,
    leadTimeDays: 18,
    onTimeDeliveryRate: 0.99,
    defectRatePct: 0.2,
    paymentTermsDays: 30,
    minOrderJpy: 300000,
    countryOfOrigin: "日本",
    certifications: ["GOTS", "OEKO-TEX"],
  },
  {
    id: "SUP-005",
    name: "Aroma Lab",
    category: "生活雑貨",
    unitPrice: 2100,
    leadTimeDays: 25,
    onTimeDeliveryRate: 0.91,
    defectRatePct: 0.6,
    paymentTermsDays: 30,
    minOrderJpy: 250000,
    countryOfOrigin: "中国",
    certifications: ["ISO 9001"],
  },
  {
    id: "SUP-006",
    name: "Health Foods Japan",
    category: "食品",
    unitPrice: 2400,
    leadTimeDays: 7,
    onTimeDeliveryRate: 0.96,
    defectRatePct: 0.1,
    paymentTermsDays: 21,
    minOrderJpy: 150000,
    countryOfOrigin: "日本",
    certifications: ["FSSC 22000"],
  },
];

export const supplierLookup = tool({
  description:
    "サプライヤーマスタから ID・名称・カテゴリで検索する。価格・リードタイム・実績・支払条件などを返す。",
  inputSchema: z.object({
    query: z.string().describe("ID / 名前 / カテゴリ"),
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    const matches = SUPPLIERS.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
    return matches.length === 0
      ? { found: false, message: `'${query}' に一致するサプライヤーはありません` }
      : { found: true, count: matches.length, suppliers: matches };
  },
});

const weightSchema = z
  .object({
    price: z.number().min(0).max(1).default(0.3),
    leadTime: z.number().min(0).max(1).default(0.2),
    onTime: z.number().min(0).max(1).default(0.2),
    quality: z.number().min(0).max(1).default(0.2),
    payment: z.number().min(0).max(1).default(0.1),
  })
  .describe("重み (合計 1.0 になるよう正規化される)");

function scoreOne(s: Supplier, refMaxPrice: number) {
  const priceScore = 1 - s.unitPrice / refMaxPrice;
  const leadTimeScore = Math.max(0, 1 - s.leadTimeDays / 60);
  const onTimeScore = s.onTimeDeliveryRate;
  const qualityScore = Math.max(0, 1 - s.defectRatePct / 5);
  const paymentScore = Math.min(1, s.paymentTermsDays / 60);
  return { priceScore, leadTimeScore, onTimeScore, qualityScore, paymentScore };
}

export const scoreSupplier = tool({
  description:
    "サプライヤー1社を価格/リードタイム/納期遵守/品質/支払条件の重みでスコアリングする (0-100点)。",
  inputSchema: z.object({
    supplierId: z.string(),
    weights: weightSchema.optional(),
  }),
  execute: async ({ supplierId, weights }) => {
    const s = SUPPLIERS.find((x) => x.id === supplierId);
    if (!s) return { ok: false, message: `${supplierId} が見つかりません` };
    const w = weights ?? {
      price: 0.3,
      leadTime: 0.2,
      onTime: 0.2,
      quality: 0.2,
      payment: 0.1,
    };
    const sumW = w.price + w.leadTime + w.onTime + w.quality + w.payment || 1;
    const refMaxPrice =
      Math.max(...SUPPLIERS.map((x) => x.unitPrice).filter((p) => p > 0)) * 1.1;
    const sc = scoreOne(s, refMaxPrice);
    const composite =
      ((sc.priceScore * w.price +
        sc.leadTimeScore * w.leadTime +
        sc.onTimeScore * w.onTime +
        sc.qualityScore * w.quality +
        sc.paymentScore * w.payment) /
        sumW) *
      100;
    return {
      ok: true,
      supplier: s,
      breakdown: {
        price: Math.round(sc.priceScore * 100),
        leadTime: Math.round(sc.leadTimeScore * 100),
        onTime: Math.round(sc.onTimeScore * 100),
        quality: Math.round(sc.qualityScore * 100),
        payment: Math.round(sc.paymentScore * 100),
      },
      compositeScore: Math.round(composite * 10) / 10,
    };
  },
});

export const compareSuppliers = tool({
  description:
    "複数のサプライヤーを同じ重みで横並び比較し、ランキングと差分を返す。",
  inputSchema: z.object({
    supplierIds: z.array(z.string()).min(2),
    weights: weightSchema.optional(),
  }),
  execute: async ({ supplierIds, weights }) => {
    const targets = SUPPLIERS.filter((s) => supplierIds.includes(s.id));
    if (targets.length < 2) {
      return {
        ok: false,
        message: `2 社以上の有効な supplierId が必要です (見つかったのは ${targets.length})`,
      };
    }
    const w = weights ?? {
      price: 0.3,
      leadTime: 0.2,
      onTime: 0.2,
      quality: 0.2,
      payment: 0.1,
    };
    const sumW = w.price + w.leadTime + w.onTime + w.quality + w.payment || 1;
    const refMaxPrice = Math.max(...targets.map((x) => x.unitPrice)) * 1.1;
    const ranked = targets
      .map((s) => {
        const sc = scoreOne(s, refMaxPrice);
        const composite =
          ((sc.priceScore * w.price +
            sc.leadTimeScore * w.leadTime +
            sc.onTimeScore * w.onTime +
            sc.qualityScore * w.quality +
            sc.paymentScore * w.payment) /
            sumW) *
          100;
        return {
          id: s.id,
          name: s.name,
          unitPrice: s.unitPrice,
          leadTimeDays: s.leadTimeDays,
          onTimeDeliveryRate: s.onTimeDeliveryRate,
          defectRatePct: s.defectRatePct,
          score: Math.round(composite * 10) / 10,
        };
      })
      .sort((a, b) => b.score - a.score);
    return {
      ok: true,
      ranking: ranked,
      winner: ranked[0],
      gapToSecond:
        ranked.length >= 2
          ? Math.round((ranked[0].score - ranked[1].score) * 10) / 10
          : null,
    };
  },
});
