// 작업일: 2026-05-03
// 헤더 우측 관리자 버튼 (클라이언트 컴포넌트)
// - 비로그인: 톱니바퀴 버튼 → 클릭 시 Google 로그인
// - 로그인(관리자): 프로필 이미지 + 이메일 + 로그아웃 버튼

"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function AdminButton() {
  const { data: session, status } = useSession();

  // 로딩 중에는 아무것도 렌더링하지 않음
  if (status === "loading") {
    return <div className="w-8 h-8" />;
  }

  // 관리자 여부 확인 (session.user에 isAdmin 플래그가 서버에서 주입됨)
  const isAdminUser = (session?.user as { isAdmin?: boolean })?.isAdmin ?? false;

  // 비로그인 상태: 톱니바퀴 버튼
  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        title="관리자 로그인"
        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
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
      </button>
    );
  }

  // 로그인했지만 관리자가 아닌 경우: 권한 없음 표시 + 로그아웃
  if (!isAdminUser) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">권한 없음</span>
        <button
          onClick={() => signOut()}
          className="text-xs text-stone-400 hover:text-stone-600 underline cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // 관리자 로그인 상태
  return (
    <div className="flex items-center gap-2">
      {session.user?.image && (
        <img
          src={session.user.image}
          alt="프로필"
          className="w-7 h-7 rounded-full border border-stone-200"
        />
      )}
      <span className="text-xs text-stone-600 hidden sm:block">
        {session.user?.email}
      </span>
      <button
        onClick={() => signOut()}
        className="text-xs text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
      >
        로그아웃
      </button>
    </div>
  );
}
