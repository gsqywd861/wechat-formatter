import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Cloudflare Workers 开发模式（非 Vercel 环境）
if (process.env.VERCEL !== "1") {
  initOpenNextCloudflareForDev();
}
