import { tool } from "ai";
import { z } from "zod";

export type Product = {
  sku: string;
  name: string;
  category: string;
  unitPrice: number;
  stock: number;
  leadTimeDays: number;
  description: string;
  features: string[];
  spec: Record<string, string>;
};

export const PRODUCTS: Product[] = [
  {
    sku: "SK-001",
    name: "ステンレスタンブラー 350ml",
    category: "キッチン用品",
    unitPrice: 1480,
    stock: 320,
    leadTimeDays: 14,
    description: "真空二重構造のステンレスタンブラー。保温保冷6時間。",
    features: ["真空二重構造", "食洗機対応", "結露しにくい外装"],
    spec: { 容量: "350ml", 重量: "210g", 材質: "ステンレス鋼 SUS304" },
  },
  {
    sku: "SK-002",
    name: "ワイヤレスイヤホン Pro",
    category: "オーディオ",
    unitPrice: 12800,
    stock: 85,
    leadTimeDays: 21,
    description: "アクティブノイズキャンセリング搭載のワイヤレスイヤホン。",
    features: ["ANC", "Bluetooth 5.3", "最大28時間再生"],
    spec: { ドライバー: "10mm ダイナミック", 充電: "USB-C/Qi", 防水: "IPX4" },
  },
  {
    sku: "SK-003",
    name: "ベビーバスタオル オーガニックコットン",
    category: "ベビー用品",
    unitPrice: 2980,
    stock: 540,
    leadTimeDays: 10,
    description: "GOTS認証オーガニックコットン100%のベビーバスタオル。",
    features: ["GOTS認証", "肌に優しいガーゼ仕立て", "5層構造"],
    spec: { サイズ: "85x85cm", 素材: "コットン100%", 原産国: "日本" },
  },
  {
    sku: "SK-004",
    name: "アロマディフューザー 木目",
    category: "生活雑貨",
    unitPrice: 4500,
    stock: 140,
    leadTimeDays: 18,
    description: "超音波式のアロマディフューザー。LEDライト付きで7色変化。",
    features: ["7色LED", "タイマー機能", "静音設計"],
    spec: { 容量: "300ml", 連続使用: "最大8時間", 電源: "AC100V" },
  },
  {
    sku: "SK-005",
    name: "プロテインバー チョコ味 (24本)",
    category: "食品",
    unitPrice: 4320,
    stock: 1200,
    leadTimeDays: 7,
    description: "1本あたりタンパク質20g、低糖質のプロテインバー。",
    features: ["タンパク質20g/本", "低糖質", "グルテンフリー"],
    spec: { 内容量: "40g x 24本", 賞味期限: "製造日より12ヶ月", 原産国: "日本" },
  },
  {
    sku: "SK-006",
    name: "ヨガマット 6mm",
    category: "スポーツ",
    unitPrice: 3600,
    stock: 210,
    leadTimeDays: 14,
    description: "TPE素材で軽量、滑り止め加工のヨガマット。",
    features: ["TPE素材", "滑り止め加工", "持ち運び用ストラップ付"],
    spec: { サイズ: "183x61x0.6cm", 重量: "900g", 素材: "TPE" },
  },
  {
    sku: "SK-007",
    name: "LED デスクライト",
    category: "家電",
    unitPrice: 5200,
    stock: 95,
    leadTimeDays: 21,
    description: "目に優しいフリッカーレスのLEDデスクライト。USBポート搭載。",
    features: ["フリッカーレス", "5段階調光", "USB急速充電"],
    spec: { 光束: "600lm", 色温度: "2700-6500K", 消費電力: "10W" },
  },
  {
    sku: "SK-008",
    name: "ペット用ブラシ",
    category: "ペット用品",
    unitPrice: 1980,
    stock: 380,
    leadTimeDays: 10,
    description: "ワンタッチで毛が取れるペット用スリッカーブラシ。",
    features: ["ワンプッシュ抜け毛除去", "人間工学グリップ", "全犬種・猫対応"],
    spec: { サイズ: "20x10cm", 重量: "180g", 材質: "ABS樹脂" },
  },
];

export const productLookup = tool({
  description:
    "商品マスタから SKU または商品名で商品情報を取得する。価格・在庫・スペックの参照に使う。",
  inputSchema: z.object({
    query: z
      .string()
      .describe("SKU (例: SK-001) または商品名の一部 (例: タンブラー)"),
  }),
  execute: async ({ query }) => {
    const q = query.trim().toLowerCase();
    const matches = PRODUCTS.filter(
      (p) =>
        p.sku.toLowerCase() === q ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q),
    );
    if (matches.length === 0) {
      return { found: false, message: `'${query}' に一致する商品はありません` };
    }
    return { found: true, count: matches.length, products: matches };
  },
});

export function findProductBySku(sku: string): Product | undefined {
  return PRODUCTS.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}
