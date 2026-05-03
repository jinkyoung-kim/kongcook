// 작업일: 2026-05-03 / 수정: 2026-05-04 (next-auth 제거, 직접 OAuth 구현)
// 헤더 우측 관리자 버튼 (클라이언트 컴포넌트)
// - 비로그인: 톱니바퀴 버튼 → 클릭 시 Google 로그인
// - 로그인(관리자): 이메일 + 로그아웃 버튼

"use client";

import { useAdminSession } from "@/lib/useAdminSession";

export function AdminButton() {
  const { isAdminUser, loading } = useAdminSession();

  if (loading) return <div className="w-8 h-8" />;

  // 비로그인 상태: 톱니바퀴 버튼
  if (!isAdminUser) {
    return (
      <a
        href="/api/auth/google"
        title="관리자 로그인"
        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
      >
        {/* 톱니바퀴 아이콘 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </a>
    );
  }

  // 관리자 로그인 상태
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-orange-600 font-medium hidden sm:block">관리자</span>
      <a
        href="/api/auth/logout"
        className="text-xs text-stone-400 hover:text-red-400 transition-colors"
      >
        로그아웃
      </a>
    </div>
  );
}
