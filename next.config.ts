import type { NextConfig } from "next";

// GITHUB_PAGES=1 builds a fully static copy for GitHub Pages (served under /<repo>).
const pages = process.env.GITHUB_PAGES === "1";
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(pages ? { output: "export", trailingSlash: true, images: { unoptimized: true }, basePath, assetPrefix: basePath || undefined } : {}),
};

export default nextConfig;
