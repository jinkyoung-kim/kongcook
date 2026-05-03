// 작업일: 2026-05-04
// Google OAuth 콜백 - 코드를 토큰으로 교환하고 세션 생성
// GET /api/auth/callback/google?code=...

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_code`);
  }

  // 인가 코드 → 액세스 토큰 교환
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error("Token exchange failed:", tokenData);
    return NextResponse.redirect(`${baseUrl}/?auth_error=token_failed`);
  }

  // 사용자 이메일 조회
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  if (!userData.email) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=no_email`);
  }

  // 관리자 여부 확인
  if (!isAdmin(userData.email)) {
    return NextResponse.redirect(`${baseUrl}/?auth_error=not_admin`);
  }

  // 세션 쿠키 생성 후 메인 페이지로 이동
  await createSession(userData.email);
  return NextResponse.redirect(baseUrl);
}
