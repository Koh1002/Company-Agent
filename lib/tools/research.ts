import { tool } from "ai";
import { z } from "zod";

type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  abstract: string;
  keywords: string[];
};

const SEED_PAPERS: Paper[] = [
  {
    id: "P-001",
    title: "Personalized Recommendation Systems in Omnichannel Retail",
    authors: ["A. Tanaka", "M. Yoshida", "S. Park"],
    year: 2024,
    venue: "ACM RecSys",
    abstract:
      "We study sequence-aware recommenders for omnichannel retail and propose a transformer-based model that conditions on basket history and store visit logs.",
    keywords: ["recommender", "retail", "omnichannel", "transformer"],
  },
  {
    id: "P-002",
    title: "Causal Effect Estimation for Promotion Uplift in Grocery Stores",
    authors: ["K. Nguyen", "J. Smith"],
    year: 2023,
    venue: "KDD",
    abstract:
      "We compare double machine learning and meta-learners for uplift estimation under unobserved confounders in grocery promotions.",
    keywords: ["causal inference", "uplift", "promotion", "retail"],
  },
  {
    id: "P-003",
    title: "Social Identity Theory and Consumer Brand Loyalty Reconsidered",
    authors: ["E. Watanabe"],
    year: 2022,
    venue: "Journal of Consumer Research",
    abstract:
      "Revisits social identity theory in the context of digital-native consumers and finds weaker but more bursty loyalty signals.",
    keywords: ["sociology", "brand loyalty", "consumer behavior"],
  },
  {
    id: "P-004",
    title: "Multi-Agent LLM Workflows for Knowledge Work Automation",
    authors: ["L. Zhang", "P. Müller", "R. Hassan"],
    year: 2025,
    venue: "NeurIPS",
    abstract:
      "Proposes a planner-executor-critic architecture for LLM agents and benchmarks on enterprise knowledge work.",
    keywords: ["LLM agent", "multi-agent", "automation", "tool use"],
  },
  {
    id: "P-005",
    title: "Demand Forecasting with Hierarchical Reconciliation at SKU-Store Level",
    authors: ["H. Sato", "I. Lopez"],
    year: 2023,
    venue: "International Journal of Forecasting",
    abstract:
      "Compares MinT, OLS, and probabilistic forecast reconciliation for SKU-store hierarchies in apparel retail.",
    keywords: ["forecasting", "hierarchical", "SKU", "retail"],
  },
  {
    id: "P-006",
    title: "Marketing Mix Modeling in the Era of Privacy",
    authors: ["B. Cohen", "F. Iwata"],
    year: 2024,
    venue: "Journal of Marketing Science",
    abstract:
      "Re-examines MMM identifiability under cookie deprecation and introduces a Bayesian prior elicitation framework.",
    keywords: ["MMM", "marketing", "Bayesian", "privacy"],
  },
  {
    id: "P-007",
    title: "ReAct: Synergizing Reasoning and Acting in Language Models",
    authors: ["S. Yao", "J. Zhao", "D. Yu", "N. Du", "I. Shafran", "K. Narasimhan", "Y. Cao"],
    year: 2023,
    venue: "ICLR",
    abstract:
      "Interleaves chain-of-thought reasoning with environment-affecting actions to improve LLM agent performance.",
    keywords: ["LLM agent", "reasoning", "tool use"],
  },
  {
    id: "P-008",
    title: "Customer Lifetime Value Prediction with Neural Survival Models",
    authors: ["G. Berger", "T. Otsuka"],
    year: 2024,
    venue: "WWW",
    abstract:
      "Proposes a discrete-time neural survival model that jointly predicts churn and spend trajectories.",
    keywords: ["CLV", "survival analysis", "retail"],
  },
  {
    id: "P-009",
    title: "Habit Formation in Subscription Commerce: A Field Experiment",
    authors: ["M. Allen", "R. Choi"],
    year: 2023,
    venue: "Marketing Science",
    abstract:
      "Field experiment on n=14k subscription customers showing nudge persistence diminishes after 8 weeks.",
    keywords: ["sociology", "habit", "subscription", "marketing"],
  },
];

export const searchPriorResearch = tool({
  description:
    "先行研究データベースをクエリ・キーワード・年で検索する (シード収録)。タイトル・著者・年・出版先・要旨を返す。",
  inputSchema: z.object({
    query: z.string(),
    yearFrom: z.number().int().optional(),
    yearTo: z.number().int().optional(),
    topK: z.number().int().min(1).max(20).default(5),
  }),
  execute: async ({ query, yearFrom, yearTo, topK }) => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    const ranked = SEED_PAPERS.map((p) => {
      const haystack = [p.title, p.abstract, ...p.keywords, p.venue, ...p.authors]
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0);
      return { p, score };
    })
      .filter((x) => x.score > 0)
      .filter((x) => (yearFrom ? x.p.year >= yearFrom : true))
      .filter((x) => (yearTo ? x.p.year <= yearTo : true))
      .sort((a, b) => b.score - a.score || b.p.year - a.p.year)
      .slice(0, topK)
      .map((x) => ({ ...x.p, score: x.score }));
    return {
      ok: true,
      query,
      hits: ranked.length,
      papers: ranked,
      note:
        ranked.length === 0
          ? "シード DB は限定的です。より広い検索には外部 API (Semantic Scholar 等) の接続を推奨。"
          : undefined,
    };
  },
});

export const designExperiment = tool({
  description:
    "研究仮説と利用可能データから、実験デザイン (IV / DV / コントロール / 検定統計量 / サンプルサイズ目安) を構造化する。",
  inputSchema: z.object({
    researchQuestion: z.string(),
    hypothesis: z.object({
      h0: z.string().describe("帰無仮説"),
      h1: z.string().describe("対立仮説"),
    }),
    independentVariables: z.array(z.string()).min(1),
    dependentVariables: z.array(z.string()).min(1),
    controlVariables: z.array(z.string()).default([]),
    method: z
      .enum([
        "rct",
        "quasi-experiment",
        "observational",
        "ab-test",
        "longitudinal",
      ])
      .default("ab-test"),
    expectedEffectSize: z
      .number()
      .positive()
      .default(0.2)
      .describe("Cohen's d など (小: 0.2 / 中: 0.5 / 大: 0.8)"),
    alpha: z.number().min(0.001).max(0.1).default(0.05),
    power: z.number().min(0.5).max(0.99).default(0.8),
  }),
  execute: async (i) => {
    // Sample size for two-sample t-test (rough): n = 16 / d^2 per arm at alpha=0.05, power=0.8
    const baseN = Math.ceil(16 / (i.expectedEffectSize * i.expectedEffectSize));
    const adjAlpha = i.alpha === 0.05 ? 1 : 0.05 / i.alpha;
    const adjPower = i.power === 0.8 ? 1 : (i.power - 0.5) / 0.3;
    const sampleSizePerArm = Math.ceil(baseN * adjAlpha * adjPower);
    return {
      ok: true,
      design: {
        researchQuestion: i.researchQuestion,
        hypothesis: i.hypothesis,
        method: i.method,
        independentVariables: i.independentVariables,
        dependentVariables: i.dependentVariables,
        controlVariables: i.controlVariables,
        statisticalTest:
          i.method === "ab-test" || i.method === "rct"
            ? "Welch's t-test (2-sample)"
            : i.method === "longitudinal"
              ? "Mixed-effects regression"
              : "Multiple regression",
        alpha: i.alpha,
        power: i.power,
        expectedEffectSize: i.expectedEffectSize,
        sampleSizePerArm,
        totalSampleSize: sampleSizePerArm * 2,
        threats: [
          "選択バイアス: 群への割付に体系的な差が出ないよう乱数化",
          "観測されない交絡因子: 共変量で調整、可能なら DML / IV 推定を併用",
          "外的妥当性: サンプル属性が母集団と乖離していないか確認",
        ],
      },
    };
  },
});

function tCdf(t: number, df: number): number {
  // Hill 1970 approximation for t distribution two-tailed CDF
  const x = df / (df + t * t);
  let p =
    1 -
    0.5 *
      Math.pow(x, df / 2) *
      (1 + (df / 2) * (1 - x) + ((df * (df + 2)) / 8) * Math.pow(1 - x, 2));
  if (Number.isNaN(p)) p = 1;
  return p;
}

export const runStatisticalTest = tool({
  description:
    "シンプルな統計検定を実行する。Welch's t-test (二群比較)、Pearson 相関の有意性、単回帰係数を返す。",
  inputSchema: z.object({
    test: z.enum(["welch-t", "correlation", "linear-regression"]),
    a: z.array(z.number()).min(2),
    b: z.array(z.number()).min(2).optional(),
    alpha: z.number().min(0.001).max(0.1).default(0.05),
  }),
  execute: async ({ test, a, b, alpha }) => {
    const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
    const variance = (xs: number[], m = mean(xs)) =>
      xs.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, xs.length - 1);

    if (test === "welch-t") {
      if (!b || b.length < 2) return { ok: false, message: "二群比較には b が必要" };
      const ma = mean(a);
      const mb = mean(b);
      const va = variance(a, ma);
      const vb = variance(b, mb);
      const se = Math.sqrt(va / a.length + vb / b.length);
      const t = (ma - mb) / se;
      const dfNum = (va / a.length + vb / b.length) ** 2;
      const dfDen =
        (va / a.length) ** 2 / (a.length - 1) +
        (vb / b.length) ** 2 / (b.length - 1);
      const df = dfDen === 0 ? a.length + b.length - 2 : dfNum / dfDen;
      const pTwoTail = Math.min(1, 2 * (1 - tCdf(Math.abs(t), df)));
      const pooledSd = Math.sqrt(((a.length - 1) * va + (b.length - 1) * vb) / (a.length + b.length - 2));
      const cohensD = pooledSd === 0 ? 0 : (ma - mb) / pooledSd;
      return {
        ok: true,
        test: "Welch's t-test",
        meanA: Math.round(ma * 1000) / 1000,
        meanB: Math.round(mb * 1000) / 1000,
        diff: Math.round((ma - mb) * 1000) / 1000,
        t: Math.round(t * 1000) / 1000,
        df: Math.round(df * 100) / 100,
        pValue: Math.round(pTwoTail * 10000) / 10000,
        cohensD: Math.round(cohensD * 1000) / 1000,
        significantAt: alpha,
        significant: pTwoTail < alpha,
      };
    }

    if (test === "correlation") {
      if (!b || b.length !== a.length)
        return { ok: false, message: "相関には同じ長さの a と b が必要" };
      const n = a.length;
      const ma = mean(a);
      const mb = mean(b);
      let num = 0;
      let dx2 = 0;
      let dy2 = 0;
      for (let i = 0; i < n; i++) {
        const dx = a[i] - ma;
        const dy = b[i] - mb;
        num += dx * dy;
        dx2 += dx * dx;
        dy2 += dy * dy;
      }
      const r = num / Math.sqrt(dx2 * dy2);
      const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
      const pTwoTail = Math.min(1, 2 * (1 - tCdf(Math.abs(t), n - 2)));
      return {
        ok: true,
        test: "Pearson correlation significance",
        n,
        r: Math.round(r * 1000) / 1000,
        t: Math.round(t * 1000) / 1000,
        df: n - 2,
        pValue: Math.round(pTwoTail * 10000) / 10000,
        significantAt: alpha,
        significant: pTwoTail < alpha,
      };
    }

    if (test === "linear-regression") {
      if (!b || b.length !== a.length)
        return { ok: false, message: "回帰には同じ長さの a (X) と b (Y) が必要" };
      const n = a.length;
      const ma = mean(a);
      const mb = mean(b);
      let sxy = 0;
      let sxx = 0;
      let syy = 0;
      for (let i = 0; i < n; i++) {
        const dx = a[i] - ma;
        const dy = b[i] - mb;
        sxy += dx * dy;
        sxx += dx * dx;
        syy += dy * dy;
      }
      const slope = sxy / sxx;
      const intercept = mb - slope * ma;
      const r2 = (sxy * sxy) / (sxx * syy);
      const se =
        Math.sqrt((syy - slope * sxy) / Math.max(1, n - 2)) / Math.sqrt(sxx);
      const t = slope / se;
      const pTwoTail = Math.min(1, 2 * (1 - tCdf(Math.abs(t), n - 2)));
      return {
        ok: true,
        test: "Simple linear regression (Y = a + bX)",
        n,
        slope: Math.round(slope * 1000) / 1000,
        intercept: Math.round(intercept * 1000) / 1000,
        r2: Math.round(r2 * 1000) / 1000,
        slopeStdErr: Math.round(se * 1000) / 1000,
        t: Math.round(t * 1000) / 1000,
        df: n - 2,
        pValue: Math.round(pTwoTail * 10000) / 10000,
        significant: pTwoTail < alpha,
      };
    }

    return { ok: false, message: "不明な test" };
  },
});

const REVIEW_RUBRIC = [
  { axis: "novelty", question: "新規性: 既存研究との違いと貢献が明確か" },
  { axis: "soundness", question: "方法論の妥当性: 統計手法・実験設計に欠陥がないか" },
  { axis: "reproducibility", question: "再現性: データ・コード・パラメータが記述されているか" },
  { axis: "clarity", question: "明確性: 用語・記法・図表が読みやすいか" },
  { axis: "limitations", question: "限界の議論: 結論を一般化しすぎていないか" },
  { axis: "ethics", question: "倫理・バイアス: 個人情報・差別的特徴量の扱いに配慮があるか" },
];

export const selfReviewPaper = tool({
  description:
    "論文ドラフトを 6 軸ルーブリック (新規性 / 妥当性 / 再現性 / 明確性 / 限界の議論 / 倫理) で厳しく自己レビューし、改善提案を返す。",
  inputSchema: z.object({
    paperText: z.string().min(100),
    targetVenue: z.string().optional().describe("投稿先 (e.g., NeurIPS / KDD / IEEE Access)"),
  }),
  execute: async ({ paperText, targetVenue }) => {
    const lower = paperText.toLowerCase();
    function score(axis: string): { score: number; rationale: string; suggestions: string[] } {
      switch (axis) {
        case "novelty":
          return /(novel|propose|introduce|new framework|first to|提案|新規|初めて)/.test(
            paperText,
          )
            ? {
                score: 4,
                rationale: "新規性の主張が明示されている",
                suggestions: ["関連研究との差分表 (Table) を追加し、強みを定量化する"],
              }
            : {
                score: 2,
                rationale: "新規性の言及が弱い",
                suggestions: [
                  "「本研究の貢献」を箇条書きで明記",
                  "近年 3 年以内の先行研究を 5 件以上比較",
                ],
              };
        case "soundness":
          return /(p\s*=|p-value|confidence interval|cross[- ]validation|baseline|rmse|mae|f1|auc|effect size)/.test(
            lower,
          )
            ? {
                score: 4,
                rationale: "統計指標と評価指標が記述されている",
                suggestions: ["事前登録 (pre-registration) や交絡因子の議論を追加"],
              }
            : {
                score: 2,
                rationale: "統計手法・指標の記述が不足",
                suggestions: [
                  "サンプルサイズ・p 値・効果量を必ず記載",
                  "ベースライン手法との比較表",
                ],
              };
        case "reproducibility":
          return /(github|code|dataset|hyperparameter|seed|config|appendix)/.test(
            lower,
          )
            ? {
                score: 4,
                rationale: "コード/データ/設定への参照あり",
                suggestions: ["乱数シードと環境 (CUDA, GPU 型番) を Appendix に明記"],
              }
            : {
                score: 1,
                rationale: "再現性に関する情報が著しく不足",
                suggestions: [
                  "データ取得手順・前処理スクリプトを公開",
                  "ハイパーパラメータ・乱数シード・実行環境を記載",
                ],
              };
        case "clarity":
          return paperText.length > 4000 && /\bsection\b|節|^#/im.test(paperText)
            ? {
                score: 4,
                rationale: "セクション構造が明示されている",
                suggestions: ["図表のキャプションを self-contained にする"],
              }
            : {
                score: 2,
                rationale: "構造または分量が不足",
                suggestions: ["IMRaD 構造で再構成", "略語は初出時にフルで定義"],
              };
        case "limitations":
          return /(limitation|限界|threats to validity|future work|今後の課題)/.test(
            lower,
          )
            ? {
                score: 4,
                rationale: "限界が議論されている",
                suggestions: ["外的妥当性 (一般化可能性) について段落を追加"],
              }
            : {
                score: 2,
                rationale: "限界の議論が無い",
                suggestions: [
                  "Section 'Threats to Validity' を追加",
                  "適用範囲・前提条件を明示",
                ],
              };
        case "ethics":
          return /(ethic|bias|fairness|privacy|consent|irb|個人情報|倫理|公平性)/.test(
            lower,
          )
            ? {
                score: 4,
                rationale: "倫理・バイアスへの配慮が記述されている",
                suggestions: ["保護属性に対する公平性指標 (DPD, EOD) を 1 つ報告"],
              }
            : {
                score: 2,
                rationale: "倫理面の記述が不足",
                suggestions: [
                  "個人情報の匿名化処理を明記",
                  "潜在的な悪用や公平性リスクを議論",
                ],
              };
        default:
          return { score: 0, rationale: "", suggestions: [] };
      }
    }

    const reviews = REVIEW_RUBRIC.map((r) => ({
      axis: r.axis,
      question: r.question,
      ...score(r.axis),
    }));
    const total = reviews.reduce((s, r) => s + r.score, 0);
    const max = REVIEW_RUBRIC.length * 5;
    const overallScore = Math.round((total / max) * 100);
    const recommendation =
      overallScore >= 75
        ? "weak-accept"
        : overallScore >= 60
          ? "borderline"
          : overallScore >= 40
            ? "weak-reject"
            : "reject";
    return {
      ok: true,
      targetVenue,
      reviews,
      overallScore,
      recommendation,
      topPriorityRevisions: reviews
        .filter((r) => r.score <= 2)
        .flatMap((r) => r.suggestions),
    };
  },
});

const referenceSchema = z.object({
  id: z.number().int().min(1),
  citation: z
    .string()
    .describe("IEEE 形式: A. Author, \"Title,\" Venue, vol., no., pp., year."),
});

const paperSectionSchema = z.object({
  heading: z.string(),
  body: z.string().describe("本文 (段落区切りは空行)。引用は [1], [2] など"),
});

export const renderIeeePaper = tool({
  description:
    "IEEE 形式の論文を自己完結 HTML (2 段組 / 番号付き節 / 引用 / 参考文献) で出力する。Word/PDF への出力前段。",
  inputSchema: z.object({
    title: z.string(),
    authors: z
      .array(
        z.object({
          name: z.string(),
          affiliation: z.string(),
          email: z.string().optional(),
        }),
      )
      .min(1),
    abstract: z.string().min(50),
    indexTerms: z.array(z.string()).min(1),
    sections: z.array(paperSectionSchema).min(3),
    references: z.array(referenceSchema).min(1),
  }),
  execute: async (i) => {
    const esc = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const authorsHtml = i.authors
      .map(
        (a) =>
          `<div class="author"><span class="name">${esc(a.name)}</span><br><span class="aff">${esc(a.affiliation)}</span>${a.email ? `<br><span class="aff">${esc(a.email)}</span>` : ""}</div>`,
      )
      .join("");
    const sectionsHtml = i.sections
      .map(
        (s, idx) =>
          `<h2>${idx + 1}. ${esc(s.heading.toUpperCase())}</h2>\n<p>${esc(s.body).replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
      )
      .join("\n");
    const refsHtml = i.references
      .sort((a, b) => a.id - b.id)
      .map((r) => `<li id="ref-${r.id}">${esc(r.citation)}</li>`)
      .join("");
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(i.title)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", "Times", "Yu Mincho", "Hiragino Mincho ProN", serif; color: #000; background: #fff; margin: 0; padding: 32px 40px 64px; max-width: 880px; margin: 0 auto; line-height: 1.4; }
  .title { font-size: 22pt; font-weight: bold; text-align: center; margin: 0 0 8px; }
  .authors { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; text-align: center; font-size: 10pt; }
  .author .name { font-size: 11pt; font-weight: 600; }
  .author .aff { font-style: italic; font-size: 9pt; }
  .abstract { margin: 12px 0 6px; font-size: 9.5pt; }
  .abstract::before { content: "Abstract—"; font-weight: bold; font-style: italic; }
  .keywords { font-size: 9.5pt; margin-bottom: 16px; }
  .keywords::before { content: "Index Terms—"; font-weight: bold; font-style: italic; }
  .twocol { column-count: 2; column-gap: 18px; font-size: 10pt; text-align: justify; }
  h2 { font-size: 10pt; font-variant: small-caps; font-weight: bold; margin: 14px 0 6px; break-after: avoid; }
  h3 { font-size: 10pt; font-style: italic; margin: 10px 0 4px; break-after: avoid; }
  p { margin: 0 0 8px; text-indent: 1em; }
  ol.refs { font-size: 9pt; padding-left: 18px; margin: 0; }
  ol.refs li { margin-bottom: 4px; }
  .refs-section h2 { font-size: 10pt; }
  hr.sep { border: none; border-top: 0.5px solid #000; margin: 16px 0; }
</style>
</head>
<body>
  <div class="title">${esc(i.title)}</div>
  <div class="authors">${authorsHtml}</div>
  <div class="twocol">
    <p class="abstract">${esc(i.abstract)}</p>
    <p class="keywords">${i.indexTerms.map(esc).join(", ")}</p>
    ${sectionsHtml}
    <div class="refs-section">
      <h2>REFERENCES</h2>
      <ol class="refs">${refsHtml}</ol>
    </div>
  </div>
</body>
</html>`;
    return {
      ok: true,
      html,
      title: i.title,
      sectionCount: i.sections.length,
      referenceCount: i.references.length,
      wordCountApprox: i.sections
        .map((s) => s.body.split(/\s+/).length)
        .reduce((a, b) => a + b, 0),
    };
  },
});
