import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 아래 내용을 추가합니다
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/app/page', // 또는 프로젝트 구조에 맞는 메인 페이지 경로
      },
    ];
  },
};

export default nextConfig;