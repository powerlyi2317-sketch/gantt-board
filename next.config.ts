import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 경로 설정을 아예 삭제해서 Next.js가 기본값(app/page.tsx)을 찾게 합니다.
};

export default nextConfig;