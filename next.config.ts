import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow the temporary Cloudflare development tunnel to load Next.js client resources.
  allowedDevOrigins: ['*.trycloudflare.com'],
  // Trigger restart: 2026-06-05
  experimental: {
    serverComponentsHmrCache: true,
  }
};

export default nextConfig;

