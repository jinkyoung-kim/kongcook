// 작업일: 2026-05-04
// 클라이언트에서 관리자 세션 상태를 가져오는 커스텀 훅

"use client";

import { useState, useEffect } from "react";

export function useAdminSession() {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setIsAdminUser(!!data?.email);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { isAdminUser, loading };
}
