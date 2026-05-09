import { tool } from "ai";
import { z } from "zod";

type Snippet = { title: string; url: string; snippet: string };

const SEED: Record<string, Snippet[]> = {
  タンブラー: [
    {
      title: "ステンレスタンブラー人気ランキング 2026",
      url: "https://example.com/tumbler-ranking",
      snippet: "保温力と軽さが評価された350ml前後のモデルが人気。価格帯は1,500-2,500円が主流。",
    },
    {
      title: "アウトドア向けタンブラー比較",
      url: "https://example.com/outdoor-tumbler",
      snippet: "蓋付き・倒れにくい底面・食洗機対応がアウトドア層の必須条件。",
    },
  ],
  イヤホン: [
    {
      title: "ワイヤレスイヤホン売れ筋トレンド",
      url: "https://example.com/earphone-trend",
      snippet: "ANC とマルチポイント接続が主要な購買決定要因に。1万円台が激戦。",
    },
  ],
  プロテイン: [
    {
      title: "プロテインバー市場分析",
      url: "https://example.com/protein-market",
      snippet: "低糖質・グルテンフリー訴求が伸長。コンビニ・EC双方で好調。",
    },
  ],
  ヨガ: [
    {
      title: "家庭向けヨガマットの選び方",
      url: "https://example.com/yoga-mat",
      snippet: "厚さ6mm前後・TPE素材・滑り止め加工が初心者の標準仕様。",
    },
  ],
};

export const webSearchStub = tool({
  description:
    "Web 検索 (スタブ実装)。決定的なサンプルスニペットを返す。実運用では本物の検索 API に差し替え。",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    const matches: Snippet[] = [];
    for (const [k, snippets] of Object.entries(SEED)) {
      if (q.includes(k.toLowerCase())) matches.push(...snippets);
    }
    if (matches.length === 0) {
      matches.push({
        title: `'${query}' の検索結果`,
        url: "https://example.com/search",
        snippet:
          "(スタブ) 該当する一般的な記事は見つかりませんでした。本番では Web 検索 API を接続してください。",
      });
    }
    return { ok: true, query, results: matches };
  },
});
