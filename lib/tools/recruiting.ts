import { tool } from "ai";
import { z } from "zod";

export const extractResume = tool({
  description:
    "履歴書 / 職務経歴書のテキストから、氏名・連絡先・学歴・職歴・スキル・経験年数の概要を構造化抽出する。",
  inputSchema: z.object({
    resume: z.string().min(20),
  }),
  execute: async ({ resume }) => {
    const emailMatch = resume.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const phoneMatch = resume.match(/0\d{1,4}[\s\-]?\d{2,4}[\s\-]?\d{3,4}/);
    const nameMatch = resume.match(/氏名[:：]\s*([一-龥ァ-ヶa-zA-Z\s]+)/);
    const yearMatch = resume.match(/(\d{1,2})\s*年(?:以上)?の(?:経験|実績)/);

    const skillKeywords = [
      "Python",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Vue",
      "Java",
      "Go",
      "Rust",
      "AWS",
      "GCP",
      "Azure",
      "SQL",
      "Docker",
      "Kubernetes",
      "プロジェクトマネジメント",
      "営業",
      "マーケティング",
      "データ分析",
      "機械学習",
      "Excel",
      "経理",
      "財務",
    ];
    const skills = skillKeywords.filter((k) =>
      resume.toLowerCase().includes(k.toLowerCase()),
    );

    const educationLines = resume
      .split(/[\n。]/)
      .filter((l) => /(大学|大学院|高校|学部|学科|卒業)/.test(l))
      .map((l) => l.trim())
      .filter(Boolean);
    const employmentLines = resume
      .split(/[\n。]/)
      .filter((l) => /(株式会社|入社|退社|転職|配属)/.test(l))
      .map((l) => l.trim())
      .filter(Boolean);

    return {
      ok: true,
      profile: {
        name: nameMatch?.[1]?.trim(),
        email: emailMatch?.[0],
        phone: phoneMatch?.[0],
        yearsOfExperience: yearMatch ? Number(yearMatch[1]) : null,
      },
      skills,
      education: educationLines.slice(0, 5),
      employment: employmentLines.slice(0, 10),
    };
  },
});

export const matchAgainstJobReq = tool({
  description:
    "候補者プロファイルを職務要件 (求人票) と突合し、スキル合致率・年数充足度・カテゴリ別スコアを返す。",
  inputSchema: z.object({
    candidate: z.object({
      skills: z.array(z.string()).default([]),
      yearsOfExperience: z.number().nonnegative().nullable().default(null),
    }),
    requirements: z.object({
      mustHaveSkills: z.array(z.string()).default([]),
      niceToHaveSkills: z.array(z.string()).default([]),
      minYears: z.number().int().min(0).default(0),
      maxYears: z.number().int().min(0).default(30),
    }),
  }),
  execute: async ({ candidate, requirements }) => {
    const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());
    const cs = lower(candidate.skills);
    const must = lower(requirements.mustHaveSkills);
    const nice = lower(requirements.niceToHaveSkills);
    const mustHits = must.filter((m) => cs.includes(m));
    const niceHits = nice.filter((m) => cs.includes(m));
    const mustRate = must.length === 0 ? 1 : mustHits.length / must.length;
    const niceRate = nice.length === 0 ? 0 : niceHits.length / nice.length;
    const yoe = candidate.yearsOfExperience ?? 0;
    const yearsOk =
      yoe >= requirements.minYears && yoe <= requirements.maxYears;
    const score = Math.round(
      (mustRate * 0.6 + niceRate * 0.2 + (yearsOk ? 1 : 0) * 0.2) * 100,
    );
    const decision =
      score >= 70 && mustRate >= 0.8 && yearsOk
        ? "shortlist"
        : score >= 50
          ? "consider"
          : "reject";
    return {
      ok: true,
      score,
      decision,
      breakdown: {
        mustHaveMatchRate: Math.round(mustRate * 100),
        niceToHaveMatchRate: Math.round(niceRate * 100),
        mustHaveMissing: must.filter((m) => !cs.includes(m)),
        yearsOk,
        yearsActual: yoe,
      },
    };
  },
});

export const rankCandidates = tool({
  description:
    "複数候補者を同じ求人要件で並び替えし、面接候補トップ N を返す。",
  inputSchema: z.object({
    candidates: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          skills: z.array(z.string()).default([]),
          yearsOfExperience: z.number().nonnegative().nullable().default(null),
        }),
      )
      .min(2),
    requirements: z.object({
      mustHaveSkills: z.array(z.string()).default([]),
      niceToHaveSkills: z.array(z.string()).default([]),
      minYears: z.number().int().min(0).default(0),
    }),
    topN: z.number().int().min(1).max(20).default(5),
  }),
  execute: async ({ candidates, requirements, topN }) => {
    const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());
    const must = lower(requirements.mustHaveSkills);
    const nice = lower(requirements.niceToHaveSkills);
    const ranked = candidates
      .map((c) => {
        const cs = lower(c.skills);
        const mustHits = must.filter((m) => cs.includes(m)).length;
        const niceHits = nice.filter((m) => cs.includes(m)).length;
        const yoe = c.yearsOfExperience ?? 0;
        const yearsOk = yoe >= requirements.minYears;
        const mustRate = must.length ? mustHits / must.length : 1;
        const niceRate = nice.length ? niceHits / nice.length : 0;
        const score = Math.round(
          (mustRate * 0.6 + niceRate * 0.2 + (yearsOk ? 1 : 0) * 0.2) * 100,
        );
        return {
          id: c.id,
          name: c.name,
          score,
          mustHits,
          niceHits,
          yearsOfExperience: yoe,
        };
      })
      .sort((a, b) => b.score - a.score);
    return {
      ok: true,
      topN: ranked.slice(0, topN),
      total: ranked.length,
      median: ranked[Math.floor(ranked.length / 2)]?.score,
    };
  },
});
