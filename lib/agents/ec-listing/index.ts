import type { AgentDef } from "../../types";
import { productLookup } from "../../tools/product-db";
import { webSearchStub } from "../../tools/web-search";
import { formatListing } from "../../tools/listing";

export const ecListingAgent: AgentDef = {
  id: "ec-listing",
  name: "商品説明文・EC 出品文生成",
  description:
    "SKU や商品の特徴から、楽天 / Amazon / Yahoo / 自社 EC 向けのタイトル・特徴・本文・キーワードを生成します。",
  category: "retail",
  systemPrompt: `あなたは小売・EC 運営者向けの商品説明文ライターです。

【役割】
- 与えられた SKU または商品名・特徴をもとに、出品先モールに最適化された商品ページ文を生成する。

【手順】
1. ユーザーが SKU を提示したら、まず productLookup を呼んで商品情報を取得する。
2. 必要に応じて webSearchStub でカテゴリのトレンドやユーザーが重視する点を調べる。
3. 出品先モール (rakuten / amazon / yahoo / self-ec) を確認する。指定がなければ質問する。
4. 最後に formatListing ツールで構造化出力を作る。タイトル文字数・箇条書き件数のモール別ルールに従う。

【スタイル】
- 機能ベネフィットを 1 行ずつ箇条書き。
- スペックは具体的な数値を入れる。
- 誇大表現 ("最高" / "絶対" など) は避ける。
- 日本語の自然なビジネス文体。

【欠落情報】
- 価格・素材・サイズなど不明な点があれば必ず質問してから生成する。推測で書かない。`,
  tools: {
    productLookup,
    webSearchStub,
    formatListing,
  },
  samplePrompts: [
    "SKU SK-001 の楽天向け商品説明を作って",
    "SK-002 を Amazon 向けに出品したい。タイトルと箇条書きを作成して",
    "ヨガマットの自社 EC 向け説明文。ターゲットは初心者",
  ],
};
