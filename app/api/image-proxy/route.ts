// 작업일: 2026-04-29
// 이미지 프록시 라우트 - 핫링크 차단된 외부 이미지(네이버 블로그 등)를 서버 측에서 가져와 브라우저에 전달
// GET /api/image-proxy?url=<인코딩된 이미지 URL>

import { NextRequest, NextResponse } from "next/server";

// 허용할 외부 이미지 도메인 (보안: 임의 URL 프록시 방지)
const ALLOWED_HOSTS = [
  "blogthumb.pstatic.net",
  "blogfiles.pstatic.net",
  "img.youtube.com",
  "i.ytimg.com",
  "postfiles.pstatic.net",
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("url 파라미터가 필요합니다", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse("잘못된 URL", { status: 400 });
  }

  // 허용된 도메인만 프록시
  if (!ALLOWED_HOSTS.some((h) => parsedUrl.hostname.endsWith(h))) {
    return new NextResponse("허용되지 않은 도메인", { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        // 네이버 CDN 핫링크 차단 우회: Referer를 naver.com으로 설정
        "Referer": "https://blog.naver.com/",
      },
    });

    if (!res.ok) {
      return new NextResponse("이미지 로드 실패", { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // 24시간 캐시
      },
    });
  } catch {
    return new NextResponse("이미지 프록시 오류", { status: 500 });
  }
}
