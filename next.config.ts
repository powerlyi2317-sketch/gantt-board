import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 배포할 때 ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 배포할 때 타입스크립트 에러 무시
    ignoreBuildErrors: true,
  },
};

export default nextConfig;