import { tool } from "ai";
import { z } from "zod";
import Papa from "papaparse";

export const parseCsv = tool({
  description:
    "CSV テキストを解析して行配列を返す。ヘッダ行ありを想定。販売実績や在庫データの取り込みに使う。",
  inputSchema: z.object({
    csv: z.string().describe("CSV 形式のテキスト"),
    delimiter: z
      .string()
      .optional()
      .describe("区切り文字 (省略時は自動検出)"),
  }),
  execute: async ({ csv, delimiter }) => {
    const result = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
      delimiter: delimiter ?? "",
    });
    if (result.errors.length > 0) {
      return {
        ok: false,
        errors: result.errors.slice(0, 5).map((e) => e.message),
      };
    }
    const rows = result.data;
    const fields = result.meta.fields ?? [];
    const numericFields = fields.filter((f) =>
      rows.every((r) => r[f] === undefined || r[f] === "" || !Number.isNaN(Number(r[f]))),
    );
    return {
      ok: true,
      rowCount: rows.length,
      fields,
      numericFields,
      sample: rows.slice(0, 5),
      rows,
    };
  },
});
