import type { NextConfig } from "next";

// Empty by default so `npm run dev`, Vercel, and root/custom-domain hosting
// work without a prefix. The GitHub Pages workflow sets this to the repo
// name (e.g. "/company-agent") for project-page deployment.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Fully static build: no server runtime required. Deployable to GitHub
  // Pages, S3, Netlify, Cloudflare Pages, Vercel — anywhere.
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
