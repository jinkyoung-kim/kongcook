// 작업일: 2026-05-03
// NextAuth Google OAuth 라우트 핸들러
// GET/POST /api/auth/* 요청을 모두 처리

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
