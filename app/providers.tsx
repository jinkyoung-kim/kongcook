// 작업일: 2026-05-03
// NextAuth SessionProvider 래퍼 (클라이언트 컴포넌트)
// layout.tsx에서 import해서 전체 앱에 세션 컨텍스트 제공

"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
