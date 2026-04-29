// 작업일: 2026-04-28
// URL 입력 → 스크래핑 → Claude 파싱 API
// POST /api/recipes/parse { url, extraText? }

import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scraper";
import { parseRecipeWithClaude } from "@/lib/parser";

export async function POST(req: NextRequest) {
  const { url, extraText } = await req.json();

  if (!url && !extraText) {
    return NextResponse.json(
      { error: "url 또는 extraText가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    let scraped;

    if (url) {
      scraped = await scrapeUrl(url);
    } else {
      // URL 없이 텍스트만 붙여넣은 경우
      scraped = {
        sourceType: "manual" as const,
        title: "레시피",
        content: "",
      };
    }

    const parsed = await parseRecipeWithClaude(scraped, extraText);

    return NextResponse.json({
      sourceType: scraped.sourceType,
      thumbnailUrl: scraped.thumbnailUrl,
      rawContent: scraped.content,
      ...parsed,
    });
  } catch (error) {
    console.error("파싱 오류:", error);

    // Claude API 크레딧 부족 감지
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isCreditError =
      errorMessage.includes("credit balance") ||
      errorMessage.includes("insufficient_quota") ||
      errorMessage.includes("billing") ||
      errorMessage.includes("Your credit balance is too low");

    if (isCreditError) {
      return NextResponse.json(
        { error: "Claude 크레딧이 부족합니다. console.anthropic.com에서 크레딧을 확인해 주세요." },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: "레시피 파싱 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
