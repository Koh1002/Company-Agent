import { tool } from "ai";
import { z } from "zod";

export const salesVelocityRank = tool({
  description:
    "SKU ごとの売上 (個数または金額) を ABC 分析でランク付けする。A: 上位 70%、B: 次の 20%、C: 残り。",
  inputSchema: z.object({
    items: z
      .array(
        z.object({
          sku: z.string(),
          name: z.string().optional(),
          sales: z.number().nonnegative(),
        }),
      )
      .min(1),
  }),
  execute: async ({ items }) => {
    const total = items.reduce((s, x) => s + x.sales, 0);
    if (total === 0) return { ok: false, message: "売上合計が 0 です" };
    const sorted = [...items].sort((a, b) => b.sales - a.sales);
    let cum = 0;
    const ranked = sorted.map((it) => {
      cum += it.sales;
      const cumPct = cum / total;
      const rank: "A" | "B" | "C" =
        cumPct <= 0.7 ? "A" : cumPct <= 0.9 ? "B" : "C";
      return {
        sku: it.sku,
        name: it.name,
        sales: it.sales,
        sharePct: Math.round((it.sales / total) * 1000) / 10,
        cumulativePct: Math.round(cumPct * 1000) / 10,
        rank,
      };
    });
    return {
      ok: true,
      total,
      counts: {
        A: ranked.filter((r) => r.rank === "A").length,
        B: ranked.filter((r) => r.rank === "B").length,
        C: ranked.filter((r) => r.rank === "C").length,
      },
      ranked,
    };
  },
});

export const planogramOptimize = tool({
  description:
    "棚幅・棚数と SKU ごとのフェース幅・売上速度を入力し、A 商品ほど多くフェースを割り当てるシンプルな棚割りを返す。",
  inputSchema: z.object({
    shelfWidthCm: z.number().positive(),
    shelfCount: z.number().int().min(1),
    items: z
      .array(
        z.object({
          sku: z.string(),
          name: z.string().optional(),
          faceWidthCm: z.number().positive(),
          velocity: z.number().nonnegative(),
        }),
      )
      .min(1),
  }),
  execute: async ({ shelfWidthCm, shelfCount, items }) => {
    const totalCapacityCm = shelfWidthCm * shelfCount;
    const totalVelocity = items.reduce((s, x) => s + x.velocity, 0);
    if (totalVelocity === 0)
      return { ok: false, message: "全 SKU の売上速度が 0 です" };

    // 1. 各SKUに目標フェース幅を割り当て (velocity 比率)
    const targets = items.map((it) => ({
      ...it,
      desiredCm: (it.velocity / totalVelocity) * totalCapacityCm,
    }));
    // 2. 整数のフェース数に変換 (最低 1 フェース)
    const allocated = targets.map((it) => {
      const faces = Math.max(1, Math.round(it.desiredCm / it.faceWidthCm));
      return { ...it, faces, usedCm: faces * it.faceWidthCm };
    });
    // 3. 合計が容量を超えたら降順で削る
    let used = allocated.reduce((s, x) => s + x.usedCm, 0);
    const sorted = [...allocated].sort((a, b) => a.velocity - b.velocity);
    while (used > totalCapacityCm) {
      const cut = sorted.find((s) => s.faces > 1);
      if (!cut) break;
      cut.faces -= 1;
      cut.usedCm -= cut.faceWidthCm;
      used -= cut.faceWidthCm;
    }
    // 4. 棚へのライン詰め (left-to-right)
    const shelves: { shelf: number; items: typeof allocated }[] = Array.from(
      { length: shelfCount },
      (_, i) => ({ shelf: i + 1, items: [] }),
    );
    const layoutOrder = [...allocated].sort((a, b) => b.velocity - a.velocity);
    let cursor = 0;
    let shelfFill = 0;
    for (const it of layoutOrder) {
      if (shelfFill + it.usedCm > shelfWidthCm) {
        cursor = (cursor + 1) % shelfCount;
        shelfFill = 0;
      }
      shelves[cursor].items.push(it);
      shelfFill += it.usedCm;
    }
    return {
      ok: true,
      shelfWidthCm,
      shelfCount,
      totalCapacityCm,
      usedCm: used,
      utilizationPct: Math.round((used / totalCapacityCm) * 1000) / 10,
      layout: shelves,
    };
  },
});

export const categoryAnalysis = tool({
  description:
    "売上履歴から、欠品リスク (在庫日数の少ない SKU) と低速 SKU (在庫日数の多い SKU) を抽出する。棚から外す候補を出す。",
  inputSchema: z.object({
    items: z
      .array(
        z.object({
          sku: z.string(),
          stock: z.number().nonnegative(),
          dailySales: z.number().nonnegative(),
        }),
      )
      .min(1),
    fastThresholdDays: z.number().int().min(1).default(7),
    slowThresholdDays: z.number().int().min(1).default(60),
  }),
  execute: async ({ items, fastThresholdDays, slowThresholdDays }) => {
    const enriched = items.map((it) => {
      const dos = it.dailySales > 0 ? it.stock / it.dailySales : Infinity;
      return {
        sku: it.sku,
        stock: it.stock,
        dailySales: it.dailySales,
        daysOfSupply: Number.isFinite(dos) ? Math.round(dos * 10) / 10 : null,
        flag:
          dos <= fastThresholdDays
            ? "stockout-risk"
            : dos >= slowThresholdDays
              ? "slow-mover"
              : "ok",
      };
    });
    return {
      ok: true,
      stockoutRisk: enriched.filter((x) => x.flag === "stockout-risk"),
      slowMovers: enriched.filter((x) => x.flag === "slow-mover"),
      healthy: enriched.filter((x) => x.flag === "ok").length,
    };
  },
});
