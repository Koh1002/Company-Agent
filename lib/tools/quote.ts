import { tool } from "ai";
import { z } from "zod";
import { findProductBySku } from "./product-db";

const lineSchema = z.object({
  sku: z.string(),
  qty: z.number().int().min(1),
  unitPrice: z
    .number()
    .nonnegative()
    .optional()
    .describe("指定なければ商品マスタの単価を使う"),
  discountPct: z.number().min(0).max(100).default(0),
});

export const buildQuote = tool({
  description:
    "見積書のラインアイテムを集計して合計を計算する。単価が省略された場合は商品マスタを参照。割引・税を反映。",
  inputSchema: z.object({
    customerName: z.string(),
    lines: z.array(lineSchema).min(1),
    taxRatePct: z.number().min(0).max(100).default(10),
    overallDiscountPct: z.number().min(0).max(100).default(0),
    validityDays: z.number().int().min(1).default(14),
    note: z.string().optional(),
  }),
  execute: async ({
    customerName,
    lines,
    taxRatePct,
    overallDiscountPct,
    validityDays,
    note,
  }) => {
    const resolved = lines.map((l) => {
      const product = findProductBySku(l.sku);
      const unitPrice = l.unitPrice ?? product?.unitPrice ?? 0;
      const lineGross = unitPrice * l.qty;
      const lineNet = lineGross * (1 - l.discountPct / 100);
      return {
        sku: l.sku,
        name: product?.name ?? "(商品マスタ未登録)",
        qty: l.qty,
        unitPrice,
        discountPct: l.discountPct,
        lineSubtotal: Math.round(lineNet),
        productFound: !!product,
      };
    });
    const subtotal = resolved.reduce((s, l) => s + l.lineSubtotal, 0);
    const afterOverallDiscount = subtotal * (1 - overallDiscountPct / 100);
    const tax = Math.round(afterOverallDiscount * (taxRatePct / 100));
    const total = Math.round(afterOverallDiscount + tax);
    const validUntil = new Date(Date.now() + validityDays * 86400000)
      .toISOString()
      .slice(0, 10);
    return {
      ok: true,
      customerName,
      lines: resolved,
      subtotal,
      overallDiscountPct,
      afterOverallDiscount: Math.round(afterOverallDiscount),
      taxRatePct,
      tax,
      total,
      validUntil,
      note,
      missingProducts: resolved.filter((l) => !l.productFound).map((l) => l.sku),
    };
  },
});

export const renderRfpDocument = tool({
  description:
    "RFP (提案依頼書) ドラフトを構造化されたセクションで生成する。回答テンプレ送付前のたたき台に使う。",
  inputSchema: z.object({
    projectName: z.string(),
    issuer: z.string().describe("発行企業名"),
    background: z.string(),
    scope: z.array(z.string()).min(1).describe("依頼スコープの箇条書き"),
    requirements: z.array(z.string()).min(1),
    deliverables: z.array(z.string()).min(1),
    timelineWeeks: z.number().int().min(1),
    submissionDeadline: z.string().describe("YYYY-MM-DD"),
    evaluationCriteria: z.array(z.string()).default([
      "技術力",
      "実績",
      "価格妥当性",
      "サポート体制",
    ]),
  }),
  execute: async (input) => {
    const sections = [
      `# RFP: ${input.projectName}`,
      `発行: ${input.issuer}\n提出期限: ${input.submissionDeadline}\n想定期間: ${input.timelineWeeks} 週間`,
      `## 1. 背景\n${input.background}`,
      `## 2. 業務スコープ\n${input.scope.map((s) => `- ${s}`).join("\n")}`,
      `## 3. 要件\n${input.requirements.map((s) => `- ${s}`).join("\n")}`,
      `## 4. 成果物\n${input.deliverables.map((s) => `- ${s}`).join("\n")}`,
      `## 5. 評価基準\n${input.evaluationCriteria.map((s) => `- ${s}`).join("\n")}`,
      `## 6. 提案フォーマット\n- 会社概要 / 実績\n- 提案概要・スケジュール\n- 体制・役割分担\n- 概算見積 (税抜)\n- 想定リスクと対策`,
    ];
    return { ok: true, document: sections.join("\n\n") };
  },
});
