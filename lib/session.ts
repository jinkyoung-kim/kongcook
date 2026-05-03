// 작업일: 2026-05-04
// 서버 세션 관리 - Jose JWT + HttpOnly 쿠키 방식
// Next.js 16 공식 문서 권장 패턴 기반

import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const encodedKey = new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "fallback-dev-secret");

// JWT 암호화 (이메일을 페이로드로 저장)
export async function encrypt(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

// JWT 복호화
export async function decrypt(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as { email: string };
  } catch {
    return null;
  }
}

// 현재 세션 조회
export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}

// 세션 생성 (로그인 완료 시)
export async function createSession(email: string): Promise<void> {
  const token = await encrypt(email);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7일
    sameSite: "lax",
    path: "/",
  });
}

// 세션 삭제 (로그아웃 시)
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
