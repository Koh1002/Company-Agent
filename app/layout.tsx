import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Company Agent — AI 業務代替プラットフォーム",
  description:
    "メーカー・卸・小売の業務を AI エージェントで代替するためのプラットフォーム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
