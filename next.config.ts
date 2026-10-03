import type { NextConfig } from "next";

const config: NextConfig = {
  output: process.env.BLUECLUE_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    return ["/sw.js", "/offline-assets.json", "/offline-pack"].map(source => ({
      source,
      headers: [{ key: "Cache-Control", value: "no-store" }]
    }));
  }
};

export default config;
