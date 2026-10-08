import type { NextConfig } from "next";

const config: NextConfig = {
  output: process.env.BLUECLUE_STANDALONE === "1" ? "standalone" : undefined,
  experimental: process.env.BLUECLUE_STANDALONE === "1" ? { cpus: 1 } : undefined,
  poweredByHeader: false,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async headers() {
    return ["/sw.js", "/offline-assets.json", "/offline-pack"].map(source => ({
      source,
      headers: [{ key: "Cache-Control", value: "no-store" }]
    }));
  }
};

export default config;
