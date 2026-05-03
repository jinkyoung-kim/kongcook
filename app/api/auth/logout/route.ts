// 작업일: 2026-05-04
// 로그아웃 - 세션 쿠키 삭제 후 메인으로 리다이렉트
// GET /api/auth/logout

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

export async function GET() {
  await deleteSession();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.redirect(baseUrl);
}
