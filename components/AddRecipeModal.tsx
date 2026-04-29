// 작업일: 2026-04-28
// 레시피 추가 모달 - URL 붙여넣기 or 텍스트 직접 입력 → Claude 파싱 → 저장

"use client";

import { useState } from "react";

interface ParsedRecipe {
  title: string;
  sourceType: string;
  thumbnailUrl?: string;
  description?: string;
  servings?: string;
  cookTime?: string;
  difficulty?: string;
  tags: string[];
  ingredients: { name: string; amount?: string; category?: string }[];
  steps: { stepOrder: number; description: string; tip?: string }[];
  rawContent?: string;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddRecipeModal({ onClose, onSaved }: Props) {
  const [url, setUrl] = useState("");
  const [extraText, setExtraText] = useState("");
  const [step, setStep] = useState<"input" | "parsing" | "review">("input");
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleParse = async () => {
    if (!url.trim() && !extraText.trim()) {
      setError("URL 또는 레시피 텍스트를 입력해주세요.");
      return;
    }
    setError("");
    setStep("parsing");

    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() || undefined, extraText: extraText.trim() || undefined }),
      });

      if (!res.ok) throw new Error("파싱 실패");

      const data = await res.json();
      setParsed(data);
      setStep("review");
    } catch {
      setError("레시피 파싱 중 오류가 발생했습니다. 다시 시도해주세요.");
      setStep("input");
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed,
          sourceUrl: url.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("저장 실패");
      onSaved();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">
            {step === "input" && "레시피 추가"}
            {step === "parsing" && "레시피 분석 중..."}
            {step === "review" && "레시피 확인"}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {/* 입력 단계 */}
          {step === "input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  URL 붙여넣기
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... 또는 블로그/SNS 주소"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div className="flex items-center gap-3 text-stone-400 text-xs">
                <div className="flex-1 h-px bg-stone-200" />
                <span>또는 레시피 텍스트 직접 붙여넣기</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  레시피 내용 (선택)
                </label>
                <textarea
                  placeholder="재료, 조리 순서 등을 붙여넣으면 더 정확하게 파싱돼요"
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleParse}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                레시피 분석하기
              </button>
            </div>
          )}

          {/* 파싱 중 */}
          {step === "parsing" && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-4 animate-spin inline-block">🍳</div>
              <p className="text-stone-600 text-sm">Claude가 레시피를 분석하고 있어요...</p>
              <p className="text-stone-400 text-xs mt-1">보통 5~15초 정도 걸려요</p>
            </div>
          )}

          {/* 결과 확인 단계 */}
          {step === "review" && parsed && (
            <div className="space-y-5">
              {/* 재료/단계 없으면 텍스트 추가 안내 */}
              {parsed.ingredients.length === 0 && parsed.steps.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">재료·조리법을 가져오지 못했어요</p>
                  <p className="text-xs text-amber-700">유튜브 영상 설명란 또는 레시피 내용을 아래에 붙여넣고 다시 분석해 주세요.</p>
                  <textarea
                    placeholder="재료 및 조리 순서 텍스트 붙여넣기..."
                    value={extraText}
                    onChange={(e) => setExtraText(e.target.value)}
                    rows={4}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                  />
                  <button
                    onClick={handleParse}
                    className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    다시 분석하기
                  </button>
                </div>
              )}
              {/* 제목 */}
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">제목</label>
                <input
                  type="text"
                  value={parsed.title}
                  onChange={(e) => setParsed({ ...parsed, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">인분</label>
                  <input
                    type="text"
                    value={parsed.servings ?? ""}
                    onChange={(e) => setParsed({ ...parsed, servings: e.target.value })}
                    placeholder="2인분"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">조리 시간</label>
                  <input
                    type="text"
                    value={parsed.cookTime ?? ""}
                    onChange={(e) => setParsed({ ...parsed, cookTime: e.target.value })}
                    placeholder="30분"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">난이도</label>
                  <select
                    value={parsed.difficulty ?? ""}
                    onChange={(e) => setParsed({ ...parsed, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">선택</option>
                    <option value="easy">쉬움</option>
                    <option value="medium">보통</option>
                    <option value="hard">어려움</option>
                  </select>
                </div>
              </div>

              {/* 재료 */}
              {parsed.ingredients.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-2">
                    재료 ({parsed.ingredients.length}개)
                  </label>
                  <div className="bg-stone-50 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
                    {parsed.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-xs px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-500 w-14 text-center shrink-0">
                          {ing.category ?? "기타"}
                        </span>
                        <span className="text-stone-800 font-medium">{ing.name}</span>
                        {ing.amount && (
                          <span className="text-stone-500 ml-auto shrink-0">{ing.amount}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 조리 순서 */}
              {parsed.steps.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-2">
                    조리 순서 ({parsed.steps.length}단계)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parsed.steps.map((s) => (
                      <div key={s.stepOrder} className="flex gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {s.stepOrder}
                        </span>
                        <div>
                          <p className="text-stone-700">{s.description}</p>
                          {s.tip && (
                            <p className="text-stone-400 text-xs mt-0.5">💡 {s.tip}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {parsed.tags.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-2">태그</label>
                  <div className="flex flex-wrap gap-1.5">
                    {parsed.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-orange-50 text-orange-600 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("input")}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-sm rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  다시 입력
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {saving ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
