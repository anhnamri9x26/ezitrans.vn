import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Trigger restart: 2026-06-05
  experimental: {
    serverComponentsHmrCache: true,
  }
};

export default nextConfig;

