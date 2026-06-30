import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Node.js modules used in API routes aren't bundled for the client
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
