// 작업일: 2026-04-28
// 레시피 상세 페이지

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";

interface Ingredient {
  id: number;
  name: string;
  amount?: string;
  category?: string;
}

interface Step {
  id: number;
  stepOrder: number;
  description: string;
  tip?: string;
}

interface RecipeDetail {
  id: string;
  title: string;
  sourceUrl?: string;
  sourceType: string;
  thumbnailUrl?: string;
  description?: string;
  servings?: string;
  cookTime?: string;
  difficulty?: string;
  tags: string[];
  memo?: string;
  createdAt: number;
  ingredients: Ingredient[];
  steps: Step[];
}

const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  blog: "블로그",
  manual: "직접 입력",
  other: "기타",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};
const DIFFICULTY_ICONS: Record<string, string> = {
  easy: "🟢",
  medium: "🟡",
  hard: "🔴",
};

const CATEGORY_COLORS: Record<string, string> = {
  채소: "bg-green-100 text-green-700",
  육류: "bg-red-100 text-red-700",
  해산물: "bg-blue-100 text-blue-700",
  유제품: "bg-yellow-100 text-yellow-700",
  양념: "bg-purple-100 text-purple-700",
  기타: "bg-stone-100 text-stone-600",
};

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setRecipe(data);
        setLoading(false);
      });
  }, [id]);

  const toggleStep = (stepOrder: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepOrder)) next.delete(stepOrder);
      else next.add(stepOrder);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!confirm("레시피를 삭제할까요?")) return;
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="text-center text-stone-400 py-20 text-sm">불러오는 중...</div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500 text-sm mb-4">레시피를 찾을 수 없습니다.</p>
        <Link href="/" className="text-orange-500 text-sm hover:underline">
          ← 목록으로
        </Link>
      </div>
    );
  }

  // 카테고리별 재료 그룹핑
  const ingredientsByCategory = (recipe.ingredients ?? []).reduce(
    (acc, ing) => {
      const cat = ing.category ?? "기타";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ing);
      return acc;
    },
    {} as Record<string, Ingredient[]>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 text-sm mb-4 transition-colors"
      >
        ← 목록으로
      </Link>

      {/* 썸네일 */}
      {recipe.sourceType === "instagram" ? (
        <div className="aspect-video rounded-2xl overflow-hidden mb-5 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
          <span className="text-7xl">📷</span>
        </div>
      ) : recipe.thumbnailUrl ? (
        <div className="aspect-video rounded-2xl overflow-hidden mb-5 bg-stone-100">
          <img
            src={resolveImageUrl(recipe.thumbnailUrl)}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      {/* 제목 + 메타 */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-stone-800 leading-tight">{recipe.title}</h1>
          <button
            onClick={handleDelete}
            className="text-stone-400 hover:text-red-400 transition-colors text-sm shrink-0 mt-1 cursor-pointer"
          >
            삭제
          </button>
        </div>

        {recipe.description && (
          <p className="text-stone-600 text-sm mt-2">{recipe.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors"
            >
              {SOURCE_LABELS[recipe.sourceType] ?? recipe.sourceType} ↗
            </a>
          ) : (
            <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full">
              {SOURCE_LABELS[recipe.sourceType] ?? recipe.sourceType}
            </span>
          )}
          {recipe.cookTime && (
            <span className="text-stone-500">⏱ {recipe.cookTime}</span>
          )}
          {recipe.servings && (
            <span className="text-stone-500">👥 {recipe.servings}</span>
          )}
          {recipe.difficulty && (
            <span className="text-stone-500">
              {DIFFICULTY_ICONS[recipe.difficulty] ?? "⚪"} {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
            </span>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <hr className="border-stone-100 mb-5" />

      {/* 재료·조리법 둘 다 없을 때 안내 */}
      {(recipe.ingredients ?? []).length === 0 && (recipe.steps ?? []).length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-medium mb-1">재료·조리법 정보가 없어요</p>
          <p className="text-xs text-amber-700">
            유튜브 영상 설명란의 재료/조리법 텍스트를 복사해서{" "}
            {recipe.sourceUrl && (
              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                원본 영상
              </a>
            )}{" "}
            아래 새 레시피로 다시 추가하거나, 레시피를 삭제 후 텍스트를 함께 붙여넣어 주세요.
          </p>
        </div>
      )}

      {/* 재료 */}
      {(recipe.ingredients ?? []).length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-stone-800 mb-3">재료</h2>
          <div className="space-y-3">
            {Object.entries(ingredientsByCategory).map(([category, items]) => (
              <div key={category}>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    CATEGORY_COLORS[category] ?? "bg-stone-100 text-stone-600"
                  }`}
                >
                  {category}
                </span>
                <div className="mt-2 space-y-1.5">
                  {items.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between text-sm py-1.5 px-3 bg-stone-50 rounded-lg"
                    >
                      <span className="text-stone-700">{ing.name}</span>
                      {ing.amount && (
                        <span className="text-stone-500">{ing.amount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 조리 순서 */}
      {(recipe.steps ?? []).length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-stone-800 mb-3">조리 순서</h2>
          <div className="space-y-3">
            {(recipe.steps ?? []).map((step) => (
              <div
                key={step.id}
                onClick={() => toggleStep(step.stepOrder)}
                className={`flex gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  checkedSteps.has(step.stepOrder)
                    ? "border-orange-200 bg-orange-50/50 opacity-60"
                    : "border-stone-100 bg-white hover:border-stone-200"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checkedSteps.has(step.stepOrder)
                      ? "bg-orange-400 text-white"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  {checkedSteps.has(step.stepOrder) ? "✓" : step.stepOrder}
                </span>
                <div>
                  <p
                    className={`text-sm text-stone-700 ${
                      checkedSteps.has(step.stepOrder) ? "line-through" : ""
                    }`}
                  >
                    {step.description}
                  </p>
                  {step.tip && (
                    <p className="text-xs text-stone-400 mt-1">💡 {step.tip}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 메모 */}
      {recipe.memo && (
        <section className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
          <h2 className="font-bold text-stone-700 text-sm mb-1">메모</h2>
          <p className="text-stone-600 text-sm">{recipe.memo}</p>
        </section>
      )}
    </div>
  );
}
