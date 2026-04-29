// 작업일: 2026-04-29
// 재료명 동의어 정규화 — 동일한 재료를 같은 이름으로 통일

// key → value 로 통일 (key를 입력하면 value로 변환)
export const INGREDIENT_SYNONYMS: Record<string, string> = {
  달걀: "계란",
  달걀노른자: "계란노른자",
  달걀흰자: "계란흰자",
  쪽파: "실파",
  대파흰부분: "대파",
  돼지고기앞다리: "돼지고기",
  돼지앞다리살: "돼지고기",
  소고기국거리: "소고기",
  소고기우둔살: "소고기",
};

export function normalizeIngredientName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, "");
  return INGREDIENT_SYNONYMS[trimmed] ?? name.trim();
}
