import { tool } from "ai";
import { z } from "zod";

export const correlationAnalysis = tool({
  description:
    "2 つの数値配列の Pearson 相関係数 r と簡易回帰係数 (slope, intercept, R²) を返す。リテイル KPI 間の関連性検証に使う。",
  inputSchema: z.object({
    label: z.string().optional(),
    x: z.array(z.number()).min(3),
    y: z.array(z.number()).min(3),
    xName: z.string().default("X"),
    yName: z.string().default("Y"),
  }),
  execute: async ({ label, x, y, xName, yName }) => {
    if (x.length !== y.length) {
      return { ok: false, message: "x と y の長さが一致しません" };
    }
    const n = x.length;
    const mx = x.reduce((a, b) => a + b, 0) / n;
    const my = y.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let dx2 = 0;
    let dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx;
      const dy = y[i] - my;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    if (dx2 === 0 || dy2 === 0) {
      return { ok: false, message: "分散が 0 のため相関を計算できません" };
    }
    const r = num / Math.sqrt(dx2 * dy2);
    const slope = num / dx2;
    const intercept = my - slope * mx;
    const r2 = r * r;
    const strength =
      Math.abs(r) >= 0.7 ? "強い" : Math.abs(r) >= 0.4 ? "中程度" : "弱い";
    return {
      ok: true,
      label,
      n,
      xName,
      yName,
      pearsonR: Math.round(r * 1000) / 1000,
      r2: Math.round(r2 * 1000) / 1000,
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 1000) / 1000,
      direction: r > 0 ? "正の相関" : r < 0 ? "負の相関" : "無相関",
      strength,
    };
  },
});

export const cohortAnalysis = tool({
  description:
    "コホート (例: 初回購入月) 別に、リテンションや購買金額などのメトリックを集計する。コホートと期間の 2 軸でクロス集計を返す。",
  inputSchema: z.object({
    rows: z
      .array(
        z.object({
          customerId: z.string(),
          cohort: z.string().describe("コホートキー (例: 2026-01)"),
          period: z.string().describe("期間キー (例: 2026-03)"),
          value: z.number(),
        }),
      )
      .min(1),
    aggregation: z.enum(["sum", "mean", "count", "uniqueCustomers"]).default("sum"),
  }),
  execute: async ({ rows, aggregation }) => {
    const matrix: Record<string, Record<string, { values: number[]; ids: Set<string> }>> = {};
    for (const r of rows) {
      (matrix[r.cohort] ||= {});
      (matrix[r.cohort][r.period] ||= { values: [], ids: new Set<string>() });
      matrix[r.cohort][r.period].values.push(r.value);
      matrix[r.cohort][r.period].ids.add(r.customerId);
    }
    const cohorts = Object.keys(matrix).sort();
    const periods = Array.from(
      new Set(rows.map((r) => r.period)),
    ).sort();
    const cells: { cohort: string; period: string; value: number }[] = [];
    for (const c of cohorts) {
      for (const p of periods) {
        const cell = matrix[c]?.[p];
        if (!cell) continue;
        const sum = cell.values.reduce((a, b) => a + b, 0);
        const v =
          aggregation === "sum"
            ? sum
            : aggregation === "mean"
              ? sum / cell.values.length
              : aggregation === "count"
                ? cell.values.length
                : cell.ids.size;
        cells.push({
          cohort: c,
          period: p,
          value: Math.round(v * 100) / 100,
        });
      }
    }
    return { ok: true, cohorts, periods, aggregation, cells };
  },
});

const sectionSchema = z.object({
  heading: z.string(),
  body: z.string().describe("段落テキスト (簡易 Markdown / HTML 安全タグも可)"),
  table: z
    .object({
      columns: z.array(z.string()),
      rows: z.array(z.array(z.union([z.string(), z.number()]))),
    })
    .optional(),
  bars: z
    .object({
      title: z.string().optional(),
      items: z
        .array(z.object({ label: z.string(), value: z.number() }))
        .min(1),
    })
    .optional(),
});

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function renderTable(cols: string[], rows: (string | number)[][]) {
  const head = cols.map((c) => `<th>${escapeHtml(String(c))}</th>`).join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${r
          .map((c) => `<td>${escapeHtml(String(c))}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderBars(items: { label: string; value: number }[], title?: string) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const rows = items
    .map(
      (it) =>
        `<div class="bar-row"><div class="bar-label">${escapeHtml(it.label)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((it.value / max) * 100)}%"></div></div><div class="bar-value">${it.value}</div></div>`,
    )
    .join("");
  return `<div class="bars">${title ? `<h4>${escapeHtml(title)}</h4>` : ""}${rows}</div>`;
}

export const renderHtmlReport = tool({
  description:
    "対話型分析の結果を、自己完結型 HTML の提案資料 (1 ファイル) として組み立てる。社内提案・経営報告に使う。",
  inputSchema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    date: z.string().optional(),
    summary: z.string().describe("エグゼクティブサマリー (要点 3-5 行)"),
    sections: z.array(sectionSchema).min(1),
    recommendations: z.array(z.string()).default([]),
  }),
  execute: async (i) => {
    const sectionsHtml = i.sections
      .map((s) => {
        const blocks: string[] = [];
        blocks.push(`<h2>${escapeHtml(s.heading)}</h2>`);
        blocks.push(
          `<p>${escapeHtml(s.body).replace(/\n/g, "<br>")}</p>`,
        );
        if (s.table) blocks.push(renderTable(s.table.columns, s.table.rows));
        if (s.bars) blocks.push(renderBars(s.bars.items, s.bars.title));
        return `<section>${blocks.join("\n")}</section>`;
      })
      .join("\n");

    const recsHtml =
      i.recommendations.length > 0
        ? `<section class="recs"><h2>推奨アクション</h2><ol>${i.recommendations
            .map((r) => `<li>${escapeHtml(r)}</li>`)
            .join("")}</ol></section>`
        : "";

    const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(i.title)}</title>
<style>
  :root { --fg:#1a1f2e; --muted:#5b6478; --accent:#2563eb; --bg:#ffffff; --panel:#f6f8fc; --border:#dde3ee; }
  * { box-sizing: border-box; }
  body { margin:0; padding:0; background:var(--bg); color:var(--fg); font-family:-apple-system,BlinkMacSystemFont,"Hiragino Sans","Yu Gothic UI",sans-serif; line-height:1.7; }
  .container { max-width: 880px; margin: 0 auto; padding: 48px 24px 72px; }
  header.top { border-bottom: 2px solid var(--accent); padding-bottom: 16px; margin-bottom: 32px; }
  header.top h1 { font-size: 28px; margin: 0 0 6px; letter-spacing: -0.01em; }
  header.top .subtitle { color: var(--muted); font-size: 14px; }
  header.top .meta { color: var(--muted); font-size: 12px; margin-top: 8px; }
  .summary { background: var(--panel); border-left: 4px solid var(--accent); padding: 16px 20px; margin-bottom: 32px; border-radius: 6px; }
  .summary h2 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent); }
  section { margin-bottom: 28px; }
  section h2 { font-size: 18px; border-bottom: 1px solid var(--border); padding-bottom: 4px; margin: 24px 0 12px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
  th, td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
  th { background: var(--panel); font-weight: 600; }
  .bars h4 { margin: 12px 0 6px; font-size: 13px; color: var(--muted); }
  .bar-row { display: grid; grid-template-columns: 160px 1fr 60px; gap: 8px; align-items: center; margin: 4px 0; font-size: 13px; }
  .bar-label { color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { background: var(--panel); border-radius: 4px; height: 14px; overflow: hidden; border: 1px solid var(--border); }
  .bar-fill { background: linear-gradient(90deg, #4f8df9, #7c5cff); height: 100%; }
  .bar-value { text-align: right; color: var(--muted); font-variant-numeric: tabular-nums; }
  .recs ol { padding-left: 20px; }
  .recs li { margin: 6px 0; }
  footer.bot { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted); font-size: 11px; }
</style>
</head>
<body>
<div class="container">
  <header class="top">
    <h1>${escapeHtml(i.title)}</h1>
    ${i.subtitle ? `<div class="subtitle">${escapeHtml(i.subtitle)}</div>` : ""}
    <div class="meta">${[i.author, i.date].filter(Boolean).map((x) => escapeHtml(String(x))).join(" / ")}</div>
  </header>
  <div class="summary">
    <h2>Executive Summary</h2>
    <div>${escapeHtml(i.summary).replace(/\n/g, "<br>")}</div>
  </div>
  ${sectionsHtml}
  ${recsHtml}
  <footer class="bot">Generated by Company Agent — リテイルデータ分析</footer>
</div>
</body>
</html>`;
    return {
      ok: true,
      html,
      title: i.title,
      sectionCount: i.sections.length,
      recommendationCount: i.recommendations.length,
    };
  },
});
