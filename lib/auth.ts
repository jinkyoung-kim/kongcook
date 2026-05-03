// 작업일: 2026-05-03 / 수정: 2026-05-04
// NextAuth 설정 + 관리자 판별 헬퍼
// 관리자는 ADMIN_EMAILS 환경변수에 콤마 구분으로 등록 (예: a@gmail.com,b@gmail.com)

import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 관리자 이메일 화이트리스트 (서버 환경변수, 외부 노출 안 됨)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // JWT 전략 사용 (별도 DB 세션 테이블 불필요)
  session: { strategy: "jwt" },
  callbacks: {
    // 세션에 isAdmin 플래그 추가 → 클라이언트에서 사용 가능
    async session({ session }) {
      if (session.user) {
        (session.user as { isAdmin?: boolean }).isAdmin = isAdmin(session.user.email);
      }
      return session;
    },
  },
};
