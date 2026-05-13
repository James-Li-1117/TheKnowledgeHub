import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  serverExternalPackages: ["sharp", "pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
