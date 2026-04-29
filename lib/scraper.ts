// 작업일: 2026-04-28
// URL에서 텍스트 콘텐츠를 추출하는 스크래퍼
// YouTube는 자막(transcript) + 설명란, 일반 페이지는 본문 텍스트 추출

import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";

export type SourceType = "youtube" | "instagram" | "blog" | "manual" | "other";

export interface ScrapedContent {
  sourceType: SourceType;
  title: string;
  content: string;
  thumbnailUrl?: string;
}

function detectSourceType(url: string): SourceType {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("instagram.com")) return "instagram";
  return "blog";
}

// 네이버 블로그 blogId / logNo 추출
function extractNaverBlogInfo(url: string): { blogId: string; logNo: string } | null {
  const m = url.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
  if (m) return { blogId: m[1], logNo: m[2] };
  return null;
}

// YouTube 동영상 ID 추출
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Instagram shortcode 추출 (reel, p 모두 지원)
function extractInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const sourceType = detectSourceType(url);

  if (sourceType === "youtube") return scrapeYouTube(url);

  if (sourceType === "instagram") return scrapeInstagram(url);

  // 네이버 블로그 전용 처리
  if (url.includes("blog.naver.com")) {
    const info = extractNaverBlogInfo(url);
    if (info) return scrapeNaverBlog(url, info.blogId, info.logNo);
  }

  return scrapeWebPage(url, sourceType);
}

async function scrapeInstagram(url: string): Promise<ScrapedContent> {
  const shortcode = extractInstagramShortcode(url);

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
  };

  let title = "Instagram 레시피";
  let thumbnailUrl: string | undefined;
  let content = "";

  // 원본 페이지 fetch — JS 렌더링 전 HTML에 포함된 JSON 데이터에서 캡션 추출
  try {
    const res = await fetch(url, { headers });
    const html = await res.text();
    const $ = cheerio.load(html);

    // OG 태그 (제목·썸네일)
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
    if (ogTitle && ogTitle !== "Instagram") title = ogTitle;
    thumbnailUrl = $('meta[property="og:image"]').attr("content");

    // ── 방법 1: JSON-LD ──
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() ?? "");
        const desc = json.description || json.articleBody || json.caption;
        if (desc && !content) content = String(desc).slice(0, 4000);
      } catch { /* 무시 */ }
    });

    // ── 방법 2: 페이지 HTML 내 Instagram 초기 데이터 JSON ──
    // Instagram은 <script> 안에 직렬화된 JSON으로 게시물 데이터를 내려줌
    if (!content) {
      // caption 필드 직접 탐색 (여러 패턴 시도)
      const patterns = [
        // "text":"캡션내용" 형태
        /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g,
        // "caption"\s*:\s*{"text":"..." 형태
        /"caption"\s*:\s*\{[^}]*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
        // edge_media_to_caption 구조
        /"edge_media_to_caption"[^}]*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/,
      ];

      for (const pattern of patterns) {
        if (content) break;
        if (pattern.global) {
          // 가장 긴 텍스트 필드를 캡션으로 간주
          const matches = [...html.matchAll(pattern as RegExp)];
          const best = matches
            .map((m) => m[1])
            .filter((t) => t.length > 20) // 너무 짧은 건 제외
            .sort((a, b) => b.length - a.length)[0];
          if (best) {
            content = best
              .replace(/\\n/g, "\n")
              .replace(/\\u003c/g, "<")
              .replace(/\\u003e/g, ">")
              .replace(/\\u0026/g, "&")
              .replace(/\\\//g, "/")
              .slice(0, 4000);
          }
        } else {
          const m = html.match(pattern as RegExp);
          if (m?.[1]) {
            content = m[1]
              .replace(/\\n/g, "\n")
              .replace(/\\u003c/g, "<")
              .replace(/\\u003e/g, ">")
              .replace(/\\u0026/g, "&")
              .replace(/\\\//g, "/")
              .slice(0, 4000);
          }
        }
      }
    }

    // ── 방법 3: embed/captioned URL ──
    if (!content && shortcode) {
      try {
        const embedRes = await fetch(
          `https://www.instagram.com/reel/${shortcode}/embed/captioned/`,
          { headers }
        );
        const embedHtml = await embedRes.text();
        const $e = cheerio.load(embedHtml);
        const caption =
          $e(".Caption").text().trim() ||
          $e("[class*='caption']").text().trim() ||
          $e(".EmbedCaption").text().trim();
        if (caption) content = caption.slice(0, 4000);
        if (!thumbnailUrl)
          thumbnailUrl = $e('meta[property="og:image"]').attr("content");
      } catch { /* 무시 */ }
    }
  } catch {
    // 페이지 접근 자체 실패
  }

  if (!content) {
    content = `Instagram 게시물: ${url}\n캡션을 자동으로 가져오지 못했습니다. 아래 캡션 입력란에 게시물 텍스트를 직접 붙여넣어 주세요.`;
  }

  return { sourceType: "instagram", title, content, thumbnailUrl };
}

async function scrapeYouTube(url: string): Promise<ScrapedContent> {
  const videoId = extractYouTubeId(url);

  // YouTube oEmbed API로 제목/썸네일 가져오기
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const oembedRes = await fetch(oembedUrl);
  const oembed = oembedRes.ok ? await oembedRes.json() : null;

  const title = oembed?.title ?? "YouTube 레시피";
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : oembed?.thumbnail_url;

  let content = "";

  // 1순위: 자막(transcript) 추출 — 가장 풍부한 레시피 정보 포함
  if (videoId) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "ko",
      }).catch(() =>
        // 한국어 자막 없으면 기본 언어로 재시도
        YoutubeTranscript.fetchTranscript(videoId)
      );

      if (transcript && transcript.length > 0) {
        // 타임스탬프 제거하고 텍스트만 합치기
        const transcriptText = transcript
          .map((t) => t.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        content = `[영상 자막]\n${transcriptText.slice(0, 4000)}`;
      }
    } catch {
      // 자막 없는 영상 — 설명란으로 폴백
    }
  }

  // 2순위: 페이지 HTML에서 설명란 추출
  if (!content) {
    try {
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Kongcook/1.0)" },
      });
      const html = await pageRes.text();

      const descMatch = html.match(/"description":\{"runs":\[(.+?)\],"accessibility"/);
      if (descMatch) {
        const runsText = descMatch[1].match(/"text":"(.*?)(?<!\\)"/g);
        if (runsText) {
          content = runsText
            .map((t) => t.replace(/^"text":"/, "").replace(/"$/, ""))
            .join("")
            .replace(/\\n/g, "\n")
            .replace(/\\u003c/g, "<")
            .replace(/\\u003e/g, ">")
            .slice(0, 3000);
        }
      }

      if (!content) {
        const attrMatch = html.match(/"attributedDescription":\{"content":"(.*?)","commandRuns"/);
        if (attrMatch) {
          content = attrMatch[1].replace(/\\n/g, "\n").slice(0, 3000);
        }
      }
    } catch {
      // 페이지 로드 실패
    }
  }

  if (!content) {
    content = `YouTube 영상: ${title}\nURL: ${url}\n자막과 설명란을 불러오지 못했습니다.`;
  }

  return { sourceType: "youtube", title, content, thumbnailUrl };
}

async function scrapeNaverBlog(
  originalUrl: string,
  blogId: string,
  logNo: string
): Promise<ScrapedContent> {
  // 네이버 블로그는 실제 콘텐츠가 PostView iframe에 있음
  const postViewUrl = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&noTrackingCode=true&directAccess=false`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": originalUrl,
    "Accept-Language": "ko-KR,ko;q=0.9",
  };

  const res = await fetch(postViewUrl, { headers });
  if (!res.ok) throw new Error(`네이버 블로그 로드 실패: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // OG 태그에서 제목/썸네일
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $(".se-title-text").text().trim() ||
    $("title").text().replace(/\s*:.*$/, "").trim() ||
    "네이버 블로그 레시피";

  const thumbnailUrl =
    $('meta[property="og:image"]').attr("content") ||
    $(".se-main-container img").first().attr("src");

  // 네이버 SE 에디터 본문 추출
  $("script, style, .blog_lft, .blog_rgt, #header, #footer, .wrap_comment").remove();

  let content = "";

  // SE 에디터 (스마트에디터 ONE) 콘텐츠
  const seContainer = $(".se-main-container, #postViewArea, .post-view");
  if (seContainer.length) {
    content = seContainer
      .text()
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 4000);
  }

  // 구 에디터 폴백
  if (!content) {
    content = $(".post-content, #postContent, .se_component_wrap")
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  }

  // 최후 폴백: body 전체
  if (!content) {
    $("script, style, nav, header, footer").remove();
    content = $("body").text().replace(/\s+/g, " ").trim().slice(0, 4000);
  }

  return { sourceType: "blog", title, content, thumbnailUrl };
}

async function scrapeWebPage(
  url: string,
  sourceType: SourceType
): Promise<ScrapedContent> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Kongcook/1.0)" },
  });

  if (!res.ok) {
    throw new Error(`페이지 로드 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // 불필요한 태그 제거
  $("script, style, nav, footer, header, aside, .ad, #ad").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || "레시피";

  // OG 이미지 추출
  const thumbnailUrl =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content");

  // 본문 텍스트 추출 (article > main > body 순으로 우선순위)
  const contentEl =
    $("article").first() ||
    $("main").first() ||
    $(".recipe, .post-content, .entry-content").first();

  const content = (contentEl.text() || $("body").text())
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  return { sourceType, title, content, thumbnailUrl };
}
