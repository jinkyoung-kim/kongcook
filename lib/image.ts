// 작업일: 2026-04-29
// 핫링크 차단된 이미지 도메인은 프록시 라우트를 통해 로드

const PROXIED_HOSTS = [
  "blogthumb.pstatic.net",
  "blogfiles.pstatic.net",
  "postfiles.pstatic.net",
];

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (PROXIED_HOSTS.some((h) => parsed.hostname.endsWith(h))) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // 잘못된 URL은 그대로 반환
  }
  return url;
}
