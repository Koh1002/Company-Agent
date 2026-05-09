import { tool } from "ai";
import { z } from "zod";

export const seasonalIndex = tool({
  description:
    "週次または月次の時系列から季節性指数 (各期間の平均/全体平均) を算出する。例: 1〜52 週の各週指数。",
  inputSchema: z.object({
    series: z
      .array(z.object({ period: z.number().int().min(1), value: z.number() }))
      .min(4)
      .describe("period は週番号 (1-52) または月番号 (1-12)"),
    cycle: z
      .number()
      .int()
      .min(2)
      .max(52)
      .describe("季節周期 (週次なら 52、月次なら 12)"),
  }),
  execute: async ({ series, cycle }) => {
    const overall =
      series.reduce((s, x) => s + x.value, 0) / Math.max(1, series.length);
    if (overall === 0) {
      return { ok: false, message: "全期間の平均が0のため指数を算出できません" };
    }
    const buckets: Record<number, number[]> = {};
    for (const x of series) {
      const k = ((x.period - 1) % cycle) + 1;
      (buckets[k] ||= []).push(x.value);
    }
    const indices = Object.entries(buckets)
      .map(([k, vs]) => ({
        period: Number(k),
        avg: vs.reduce((a, b) => a + b, 0) / vs.length,
        index: vs.reduce((a, b) => a + b, 0) / vs.length / overall,
        n: vs.length,
      }))
      .sort((a, b) => a.period - b.period)
      .map((x) => ({
        period: x.period,
        index: Math.round(x.index * 1000) / 1000,
        avgValue: Math.round(x.avg * 100) / 100,
        sampleSize: x.n,
      }));
    return { ok: true, overallAverage: Math.round(overall * 100) / 100, indices };
  },
});

export const weeklyForecast = tool({
  description:
    "ベースライン需要 × 季節指数 × トレンド成長率で N 週先の予測を生成する。SKU × 店舗 × 週など細かい粒度のフォーキャストに使う。",
  inputSchema: z.object({
    baseline: z.number().nonnegative().describe("週あたり平均需要"),
    seasonalIndices: z
      .array(z.number().nonnegative())
      .min(1)
      .describe("先頭から N 週分の季節指数"),
    growthRatePerWeek: z
      .number()
      .min(-0.5)
      .max(0.5)
      .default(0)
      .describe("週あたり成長率 (例: 0.01 = 1%増)"),
    label: z.string().optional().describe("対象 SKU や店舗名など"),
  }),
  execute: async ({ baseline, seasonalIndices, growthRatePerWeek, label }) => {
    const forecast = seasonalIndices.map((idx, i) => {
      const v = baseline * idx * Math.pow(1 + growthRatePerWeek, i);
      return { weekOffset: i + 1, demand: Math.max(0, Math.round(v)) };
    });
    const total = forecast.reduce((s, f) => s + f.demand, 0);
    return { ok: true, label, totalDemand: total, weeks: forecast };
  },
});

export const aggregateByDimension = tool({
  description:
    "行配列を指定キーで集計 (合計/平均) する。SKU 別・店舗別・週別のロールアップに使う。",
  inputSchema: z.object({
    rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1),
    groupBy: z.string().describe("集計キー列名"),
    valueField: z.string().describe("数値列名"),
    aggregation: z.enum(["sum", "mean", "max", "min"]).default("sum"),
  }),
  execute: async ({ rows, groupBy, valueField, aggregation }) => {
    const groups: Record<string, number[]> = {};
    for (const r of rows) {
      const k = String(r[groupBy] ?? "(null)");
      const v = Number(r[valueField]);
      if (!Number.isNaN(v)) (groups[k] ||= []).push(v);
    }
    const results = Object.entries(groups).map(([k, vs]) => {
      const sum = vs.reduce((a, b) => a + b, 0);
      const value =
        aggregation === "sum"
          ? sum
          : aggregation === "mean"
            ? sum / vs.length
            : aggregation === "max"
              ? Math.max(...vs)
              : Math.min(...vs);
      return { key: k, count: vs.length, value: Math.round(value * 100) / 100 };
    });
    results.sort((a, b) => b.value - a.value);
    return { ok: true, groupBy, valueField, aggregation, results };
  },
});
