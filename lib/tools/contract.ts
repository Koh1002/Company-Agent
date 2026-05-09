import { tool } from "ai";
import { z } from "zod";

const CLAUSE_PATTERNS: { type: string; patterns: RegExp[] }[] = [
  { type: "term", patterns: [/契約期間|有効期間|契約終了/, /\d+\s*(年|月|日)間/] },
  { type: "termination", patterns: [/解除|解約|中途解約|終了事由/] },
  { type: "auto-renewal", patterns: [/自動(更新|延長)|更新期間/] },
  { type: "payment", patterns: [/支払(い|条件)|支払期日|前払|後払/] },
  { type: "penalty", patterns: [/違約金|遅延損害金|ペナルティ/] },
  { type: "liability", patterns: [/賠償(責任)?|損害賠償|免責|責任の制限/] },
  { type: "confidentiality", patterns: [/秘密保持|機密情報|NDA/] },
  { type: "ip", patterns: [/知的財産権|著作権|特許/] },
  { type: "governing-law", patterns: [/準拠法|管轄|裁判所/] },
  { type: "force-majeure", patterns: [/不可抗力|天災|自然災害/] },
  { type: "data-protection", patterns: [/個人情報|プライバシー|データ保護/] },
  { type: "indemnity", patterns: [/補償|免責|indemnif/i] },
];

export const extractClauses = tool({
  description:
    "契約書テキストから主要条項 (期間/解除/支払/違約金/賠償/秘密保持/IP/管轄など) を抽出する。条項ごとに該当文の抜粋を返す。",
  inputSchema: z.object({
    contract: z.string().min(20),
    maxSnippetsPerType: z.number().int().min(1).max(5).default(2),
  }),
  execute: async ({ contract, maxSnippetsPerType }) => {
    // 句点 / 改行で大まかに分割
    const sentences = contract
      .split(/[。\n]+/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 4);
    const result: Record<string, string[]> = {};
    for (const c of CLAUSE_PATTERNS) {
      const hits: string[] = [];
      for (const sent of sentences) {
        if (c.patterns.some((p) => p.test(sent))) {
          hits.push(sent);
          if (hits.length >= maxSnippetsPerType) break;
        }
      }
      if (hits.length > 0) result[c.type] = hits;
    }
    return {
      ok: true,
      contractLength: contract.length,
      detectedTypes: Object.keys(result),
      missingTypes: CLAUSE_PATTERNS.map((c) => c.type).filter(
        (t) => !(t in result),
      ),
      clauses: result,
    };
  },
});

const RISK_RULES: { id: string; pattern: RegExp; severity: "high" | "medium" | "low"; reason: string }[] = [
  {
    id: "auto-renewal-no-notice",
    pattern: /自動更新.*(?:申し出|通知|書面)?(?!.*\d+\s*(?:日|月)前)/,
    severity: "medium",
    reason: "自動更新の解約通知期限が不明確",
  },
  {
    id: "unlimited-liability",
    pattern: /(?:無制限|一切|全ての).*(?:賠償|責任を負う)/,
    severity: "high",
    reason: "賠償責任の上限が設定されていない",
  },
  {
    id: "broad-confidentiality",
    pattern: /秘密保持.*(?:無期限|永久|無制限)/,
    severity: "medium",
    reason: "秘密保持義務が無期限になっている",
  },
  {
    id: "one-sided-termination",
    pattern: /(?:甲|乙|当社)は.*いつでも.*(?:解除|解約)/,
    severity: "high",
    reason: "一方的な無条件解除権が含まれている",
  },
  {
    id: "missing-cap",
    pattern: /(?:損害賠償.*(?:全額|総額)|賠償の上限)/,
    severity: "low",
    reason: "賠償上限の表現を要確認",
  },
  {
    id: "favorable-jurisdiction",
    pattern: /管轄.*(?:海外|米国|英国|シンガポール)/,
    severity: "medium",
    reason: "国外管轄が指定されている",
  },
];

export const flagContractRisks = tool({
  description:
    "契約書テキストをルールベースでスキャンし、リスク条項 (無制限賠償・一方的解除・自動更新の通知期間欠落など) を抽出する。",
  inputSchema: z.object({
    contract: z.string().min(20),
  }),
  execute: async ({ contract }) => {
    const flags: { id: string; severity: string; reason: string; snippet: string }[] = [];
    for (const r of RISK_RULES) {
      const m = contract.match(r.pattern);
      if (m) {
        const idx = m.index ?? 0;
        const snippet = contract.slice(Math.max(0, idx - 30), idx + 80);
        flags.push({
          id: r.id,
          severity: r.severity,
          reason: r.reason,
          snippet: snippet.replace(/\s+/g, " ").trim(),
        });
      }
    }
    return {
      ok: true,
      flagCount: flags.length,
      flags,
      summary: {
        high: flags.filter((f) => f.severity === "high").length,
        medium: flags.filter((f) => f.severity === "medium").length,
        low: flags.filter((f) => f.severity === "low").length,
      },
    };
  },
});

export const compareToStandard = tool({
  description:
    "標準契約書との差分要点を提示する。標準テンプレを引数で渡し、対象契約書と比較。簡易的な行レベル差分を返す。",
  inputSchema: z.object({
    standard: z.string().min(20),
    candidate: z.string().min(20),
  }),
  execute: async ({ standard, candidate }) => {
    const std = new Set(
      standard
        .split(/[。\n]+/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 4),
    );
    const cand = new Set(
      candidate
        .split(/[。\n]+/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 4),
    );
    const onlyInCandidate = [...cand].filter((s) => !std.has(s));
    const missingFromCandidate = [...std].filter((s) => !cand.has(s));
    return {
      ok: true,
      addedClauses: onlyInCandidate.slice(0, 20),
      removedClauses: missingFromCandidate.slice(0, 20),
      addedCount: onlyInCandidate.length,
      removedCount: missingFromCandidate.length,
    };
  },
});
