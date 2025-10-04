import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://clinic-api-333841141189.us-central1.run.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
