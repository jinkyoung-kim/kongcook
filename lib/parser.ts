// 작업일: 2026-04-28
// Claude API를 사용해 스크래핑된 텍스트를 레시피 포맷으로 정규화

import Anthropic from "@anthropic-ai/sdk";
import type { ScrapedContent } from "./scraper";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ParsedIngredient {
  name: string;
  amount?: string;
  category?: string; // 채소 | 육류 | 해산물 | 유제품 | 양념 | 기타
}

export interface ParsedStep {
  stepOrder: number;
  description: string;
  tip?: string;
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  servings?: string;
  cookTime?: string;
  difficulty?: "easy" | "medium" | "hard";
  ingredients: ParsedIngredient[];
  steps: ParsedStep[];
  tags: string[];
}

const SYSTEM_PROMPT = `너는 레시피 파싱 전문가야.
입력된 텍스트에서 레시피 정보를 추출해서 정확히 아래 JSON 스키마로 반환해.
JSON만 반환하고, 마크다운 코드블록 없이 순수 JSON만 출력해.

스키마:
{
  "title": "레시피 이름",
  "description": "한 줄 소개 (없으면 null)",
  "servings": "몇 인분 (예: 2인분, 없으면 null)",
  "cookTime": "조리 시간 (예: 30분, 없으면 null)",
  "difficulty": "easy | medium | hard (없으면 null)",
  "ingredients": [
    {
      "name": "재료명",
      "amount": "양 (예: 1/2모, 없으면 null)",
      "category": "채소 | 육류 | 해산물 | 유제품 | 양념 | 기타"
    }
  ],
  "steps": [
    {
      "stepOrder": 1,
      "description": "조리 단계 설명",
      "tip": "팁 (없으면 null)"
    }
  ],
  "tags": ["태그1", "태그2"]
}

규칙:
- 재료 카테고리: 채소/과일→채소, 소고기/돼지/닭→육류, 생선/조개→해산물, 우유/치즈/버터→유제품, 소금/간장/된장 등→양념, 그 외→기타
- difficulty: 재료 5개 이하+단계 3개 이하=easy, 재료 10개 이하=medium, 그 이상=hard
- tags: 요리 종류(국물요리, 볶음 등), 특성(비건, 간단, 매운 등) 위주로 3~5개
- 재료는 양이 없어도 이름만 있으면 추출해. amount는 null로 두면 됨
- 조리 단계가 명확하지 않으면 내용에서 추론해서 간단하게라도 작성해
- 제목에 요리 이름이 있으면 반드시 재료와 단계를 추출 시도해. 빈 배열 반환 금지
- 영상 자막이나 설명란에 건강 정보가 섞여 있어도 레시피 부분만 뽑아내`;

export async function parseRecipeWithClaude(
  scraped: ScrapedContent,
  extraText?: string
): Promise<ParsedRecipe> {
  const inputText = extraText
    ? `제목: ${scraped.title}\n\n추가 내용:\n${extraText}\n\n페이지 내용:\n${scraped.content}`
    : `제목: ${scraped.title}\n\n내용:\n${scraped.content}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    // 프롬프트 캐싱 적용 (시스템 프롬프트 재사용 시 비용 절감)
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: inputText,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text) as ParsedRecipe;
    return parsed;
  } catch {
    // JSON 파싱 실패 시 기본 구조 반환
    return {
      title: scraped.title,
      description: undefined,
      servings: undefined,
      cookTime: undefined,
      difficulty: undefined,
      ingredients: [],
      steps: [],
      tags: [],
    };
  }
}
