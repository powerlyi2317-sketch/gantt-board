import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 경로를 더 명확하게 잡아줍니다.
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/page', 
      },
    ];
  },
};

export default nextConfig;