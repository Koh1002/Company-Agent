import { tool } from "ai";
import { z } from "zod";

function inverseNormalCdf(p: number): number {
  // Beasley-Springer-Moro approximation
  if (p <= 0 || p >= 1) return 0;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

export const movingAverage = tool({
  description: "数値配列の N 期移動平均を返す。需要予測の基礎値計算に使う。",
  inputSchema: z.object({
    values: z.array(z.number()).min(2),
    window: z.number().int().min(2).describe("移動平均の窓 (日数など)"),
  }),
  execute: async ({ values, window }) => {
    if (window > values.length) {
      return { ok: false, message: "窓サイズが配列長より大きいです" };
    }
    const ma: number[] = [];
    for (let i = window - 1; i < values.length; i++) {
      const slice = values.slice(i - window + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / window;
      ma.push(Math.round(avg * 100) / 100);
    }
    const latest = ma[ma.length - 1];
    return { ok: true, window, movingAverages: ma, latest };
  },
});

export const safetyStock = tool({
  description:
    "需要の標準偏差・リードタイム・サービス水準から安全在庫を計算する。Z * σ * √L の単純式。",
  inputSchema: z.object({
    dailyDemand: z.array(z.number()).min(2).describe("日次需要の履歴"),
    leadTimeDays: z.number().int().min(1),
    serviceLevel: z
      .number()
      .min(0.5)
      .max(0.999)
      .describe("サービス水準 (例: 0.95)")
      .default(0.95),
  }),
  execute: async ({ dailyDemand, leadTimeDays, serviceLevel }) => {
    const n = dailyDemand.length;
    const mean = dailyDemand.reduce((a, b) => a + b, 0) / n;
    const variance =
      dailyDemand.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
    const sd = Math.sqrt(variance);
    const z = inverseNormalCdf(serviceLevel);
    const ss = z * sd * Math.sqrt(leadTimeDays);
    return {
      ok: true,
      meanDailyDemand: Math.round(mean * 100) / 100,
      stdev: Math.round(sd * 100) / 100,
      zScore: Math.round(z * 1000) / 1000,
      leadTimeDays,
      serviceLevel,
      safetyStock: Math.ceil(ss),
    };
  },
});

export const reorderSuggestion = tool({
  description:
    "発注点 (ROP) と推奨発注数を計算する。ROP = 平均日次需要 × リードタイム + 安全在庫。",
  inputSchema: z.object({
    meanDailyDemand: z.number().nonnegative(),
    leadTimeDays: z.number().int().min(1),
    safetyStock: z.number().nonnegative(),
    currentStock: z.number().nonnegative(),
    reviewPeriodDays: z
      .number()
      .int()
      .min(1)
      .default(30)
      .describe("発注サイクル (この期間分の需要を補充するイメージ)"),
  }),
  execute: async ({
    meanDailyDemand,
    leadTimeDays,
    safetyStock,
    currentStock,
    reviewPeriodDays,
  }) => {
    const rop = meanDailyDemand * leadTimeDays + safetyStock;
    const targetStock =
      meanDailyDemand * (leadTimeDays + reviewPeriodDays) + safetyStock;
    const shouldReorder = currentStock <= rop;
    const orderQty = Math.max(0, Math.ceil(targetStock - currentStock));
    return {
      ok: true,
      reorderPoint: Math.ceil(rop),
      targetStock: Math.ceil(targetStock),
      currentStock,
      shouldReorder,
      orderQty,
      rationale: shouldReorder
        ? `現在庫 ${currentStock} ≤ 発注点 ${Math.ceil(rop)} のため発注を推奨`
        : `現在庫 ${currentStock} > 発注点 ${Math.ceil(rop)} のため発注不要`,
    };
  },
});
