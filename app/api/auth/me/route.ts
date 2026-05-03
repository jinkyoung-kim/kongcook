// 작업일: 2026-05-04
// 현재 로그인된 관리자 정보 조회 (클라이언트 컴포넌트용)
// GET /api/auth/me → { email } or 401

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }
  return NextResponse.json({ email: session.email });
}
