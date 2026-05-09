import { tool } from "ai";
import { z } from "zod";

export const economicOrderQuantity = tool({
  description:
    "EOQ (経済発注量) を計算する。EOQ = sqrt(2 * 年需要 * 発注コスト / 在庫保有コスト)。",
  inputSchema: z.object({
    annualDemand: z.number().positive(),
    orderingCost: z.number().positive().describe("1 回あたり発注コスト (円)"),
    holdingCostPerUnit: z
      .number()
      .positive()
      .describe("1 個あたりの年間保有コスト (円)"),
  }),
  execute: async ({ annualDemand, orderingCost, holdingCostPerUnit }) => {
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
    const ordersPerYear = annualDemand / eoq;
    const cycleDays = 365 / ordersPerYear;
    const totalCost =
      (annualDemand / eoq) * orderingCost + (eoq / 2) * holdingCostPerUnit;
    return {
      ok: true,
      eoq: Math.ceil(eoq),
      ordersPerYear: Math.round(ordersPerYear * 10) / 10,
      cycleDays: Math.round(cycleDays * 10) / 10,
      annualTotalCost: Math.round(totalCost),
    };
  },
});

export const replenishmentPlan = tool({
  description:
    "MOQ・荷姿単位 (ケース入数)・リードタイムを考慮した補充発注プランを返す。EOQ や手元在庫からの推奨発注ロットを丸める。",
  inputSchema: z.object({
    sku: z.string(),
    targetOrderQty: z
      .number()
      .nonnegative()
      .describe("理論上の発注数量 (EOQ や reorderSuggestion の結果)"),
    moq: z.number().int().nonnegative().default(0).describe("最低発注数量"),
    caseSize: z.number().int().min(1).default(1).describe("1 ケースあたり入数"),
    leadTimeDays: z.number().int().min(1),
    supplier: z.string().optional(),
  }),
  execute: async ({
    sku,
    targetOrderQty,
    moq,
    caseSize,
    leadTimeDays,
    supplier,
  }) => {
    const afterMoq = Math.max(targetOrderQty, moq);
    const cases = Math.ceil(afterMoq / caseSize);
    const orderQty = cases * caseSize;
    const expectedArrival = new Date(Date.now() + leadTimeDays * 86400000)
      .toISOString()
      .slice(0, 10);
    return {
      ok: true,
      sku,
      supplier,
      requestedQty: targetOrderQty,
      moq,
      caseSize,
      cases,
      orderQty,
      leadTimeDays,
      expectedArrival,
      adjustedFromTarget: orderQty !== Math.ceil(targetOrderQty),
    };
  },
});

export const dailyDepletionForecast = tool({
  description:
    "現在庫と日次需要から在庫切れまでの日数 (DOH = days of supply) を返す。",
  inputSchema: z.object({
    currentStock: z.number().nonnegative(),
    dailyDemand: z.number().positive(),
    incomingPo: z
      .array(
        z.object({
          qty: z.number().positive(),
          arriveInDays: z.number().int().min(0),
        }),
      )
      .default([])
      .describe("入荷予定 (発注済み PO)"),
  }),
  execute: async ({ currentStock, dailyDemand, incomingPo }) => {
    let stock = currentStock;
    let day = 0;
    let stockoutDay: number | null = null;
    const sorted = [...incomingPo].sort(
      (a, b) => a.arriveInDays - b.arriveInDays,
    );
    while (day < 365) {
      const arrivalsToday = sorted.filter((p) => p.arriveInDays === day);
      stock += arrivalsToday.reduce((s, p) => s + p.qty, 0);
      stock -= dailyDemand;
      if (stock < 0 && stockoutDay === null) {
        stockoutDay = day;
        break;
      }
      day++;
    }
    return {
      ok: true,
      stockoutInDays: stockoutDay,
      finalStock: Math.round(stock),
      assumedDailyDemand: dailyDemand,
      poCount: incomingPo.length,
    };
  },
});
