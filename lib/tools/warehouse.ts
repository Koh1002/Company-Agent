import { tool } from "ai";
import { z } from "zod";

export type WarehouseDailyMetric = {
  date: string;
  inboundUnits: number;
  outboundUnits: number;
  pickAccuracyPct: number;
  shippedOnTimePct: number;
  utilizationPct: number;
  laborHours: number;
};

const today = new Date("2026-05-08");
function dayOffset(n: number): string {
  return new Date(today.getTime() - n * 86400000).toISOString().slice(0, 10);
}

export const WAREHOUSE_METRICS: WarehouseDailyMetric[] = Array.from(
  { length: 14 },
  (_, i) => {
    const noise = (s: number) => 1 + ((Math.sin(i * 0.7 + s) + 1) / 2) * 0.15;
    return {
      date: dayOffset(13 - i),
      inboundUnits: Math.round(2200 * noise(1)),
      outboundUnits: Math.round(2400 * noise(2)),
      pickAccuracyPct: Math.round((98 + (Math.cos(i) + 1)) * 100) / 100,
      shippedOnTimePct: Math.round((96 + (Math.sin(i * 0.3) + 1) * 1.5) * 100) / 100,
      utilizationPct: Math.round((75 + (Math.sin(i * 0.5) + 1) * 8) * 100) / 100,
      laborHours: Math.round(180 * noise(3)),
    };
  },
);

export const warehouseMetrics = tool({
  description:
    "倉庫の日次 KPI (入荷/出荷数・ピック精度・出荷遵守率・稼働率・労働時間) を取得する。日数を指定して直近 N 日分を返す。",
  inputSchema: z.object({
    days: z.number().int().min(1).max(60).default(7),
  }),
  execute: async ({ days }) => {
    const recent = WAREHOUSE_METRICS.slice(-days);
    const avg = (key: keyof WarehouseDailyMetric) =>
      recent.reduce((s, m) => s + Number(m[key]), 0) / recent.length;
    return {
      ok: true,
      days: recent.length,
      averages: {
        inboundUnits: Math.round(avg("inboundUnits")),
        outboundUnits: Math.round(avg("outboundUnits")),
        pickAccuracyPct: Math.round(avg("pickAccuracyPct") * 100) / 100,
        shippedOnTimePct: Math.round(avg("shippedOnTimePct") * 100) / 100,
        utilizationPct: Math.round(avg("utilizationPct") * 100) / 100,
        laborHours: Math.round(avg("laborHours")),
      },
      daily: recent,
    };
  },
});

export const kpiAnalyze = tool({
  description:
    "実績 KPI を目標値と比較し、達成/未達フラグを返す。目標未達 KPI を箇条書きにする。",
  inputSchema: z.object({
    actual: z.object({
      pickAccuracyPct: z.number(),
      shippedOnTimePct: z.number(),
      utilizationPct: z.number(),
      inboundUnits: z.number(),
      outboundUnits: z.number(),
    }),
    target: z
      .object({
        pickAccuracyPct: z.number().default(99.5),
        shippedOnTimePct: z.number().default(98),
        utilizationPct: z.number().default(80),
      })
      .default({
        pickAccuracyPct: 99.5,
        shippedOnTimePct: 98,
        utilizationPct: 80,
      }),
  }),
  execute: async ({ actual, target }) => {
    const compare = (a: number, t: number) => ({
      actual: a,
      target: t,
      gap: Math.round((a - t) * 100) / 100,
      ok: a >= t,
    });
    const result = {
      pickAccuracyPct: compare(actual.pickAccuracyPct, target.pickAccuracyPct),
      shippedOnTimePct: compare(
        actual.shippedOnTimePct,
        target.shippedOnTimePct,
      ),
      utilizationPct: compare(actual.utilizationPct, target.utilizationPct),
      inboundOutboundBalance: {
        inbound: actual.inboundUnits,
        outbound: actual.outboundUnits,
        netUnits: actual.inboundUnits - actual.outboundUnits,
      },
    };
    const issues = Object.entries(result)
      .filter(([, v]) => "ok" in v && !v.ok)
      .map(([k]) => k);
    return { ok: true, result, issues };
  },
});

export const inventoryHealth = tool({
  description:
    "倉庫内 SKU の在庫健全度 (滞留在庫・回転率) を集計する。回転日数 (DOH) を計算してロケーション最適化候補を出す。",
  inputSchema: z.object({
    items: z
      .array(
        z.object({
          sku: z.string(),
          stock: z.number().nonnegative(),
          dailySales: z.number().nonnegative(),
          locationZone: z.enum(["A", "B", "C"]).default("B"),
        }),
      )
      .min(1),
  }),
  execute: async ({ items }) => {
    const enriched = items.map((it) => {
      const dos = it.dailySales > 0 ? it.stock / it.dailySales : Infinity;
      let recommendedZone: "A" | "B" | "C";
      if (dos <= 14) recommendedZone = "A";
      else if (dos <= 60) recommendedZone = "B";
      else recommendedZone = "C";
      return {
        sku: it.sku,
        stock: it.stock,
        dailySales: it.dailySales,
        daysOfSupply: Number.isFinite(dos) ? Math.round(dos * 10) / 10 : null,
        currentZone: it.locationZone,
        recommendedZone,
        relocationNeeded: it.locationZone !== recommendedZone,
      };
    });
    return {
      ok: true,
      total: enriched.length,
      relocationNeeded: enriched.filter((x) => x.relocationNeeded),
      summary: {
        A: enriched.filter((x) => x.recommendedZone === "A").length,
        B: enriched.filter((x) => x.recommendedZone === "B").length,
        C: enriched.filter((x) => x.recommendedZone === "C").length,
      },
    };
  },
});
