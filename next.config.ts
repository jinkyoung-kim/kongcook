// 작업일: 2026-04-29
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway 배포용 standalone 모드 (node server.js 로 실행)
  output: "standalone",
};

export default nextConfig;
