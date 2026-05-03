// 작업일: 2026-05-03 / 수정: 2026-05-04
// 관리자 판별 헬퍼
// 관리자는 ADMIN_EMAILS 환경변수에 콤마 구분으로 등록 (예: a@gmail.com,b@gmail.com)

// 관리자 이메일 화이트리스트 (서버 환경변수, 외부 노출 안 됨)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
