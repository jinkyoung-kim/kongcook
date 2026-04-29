// 작업일: 2026-04-29
// 메인 페이지 - URL 직접 입력 저장 + 검색 토글 + 무한스크롤 목록

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";

const LIMIT = 12;

interface RecipeSummary {
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
}

interface ParsedPreview {
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

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "쉬움", medium: "보통", hard: "어려움",
};
const DIFFICULTY_ICONS: Record<string, string> = {
  easy: "🟢", medium: "🟡", hard: "🔴",
};
const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube", instagram: "Instagram", blog: "블로그", manual: "직접 입력", other: "기타",
};
const SOURCE_COLORS: Record<string, string> = {
  youtube:   "bg-red-100 text-red-600",
  instagram: "bg-purple-100 text-purple-600",
  blog:      "bg-green-100 text-green-700",
  manual:    "bg-stone-100 text-stone-600",
  other:     "bg-stone-100 text-stone-500",
};

export default function HomePage() {
  // ── URL 입력 & 파싱 상태 ──
  const [url, setUrl] = useState("");
  const [extraText, setExtraText] = useState("");
  const [parseState, setParseState] = useState<"idle" | "loading" | "preview" | "saving">("idle");
  const isSaving = parseState === "saving";
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState("");

  // ── 검색 패널 ──
  const [searchOpen, setSearchOpen] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [topIngredients, setTopIngredients] = useState<string[]>([]);

  // ── 레시피 목록 & 무한스크롤 ──
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // ── 레시피 목록 로드 ──
  const loadRecipes = useCallback(async (reset: boolean, q: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setListLoading(true);

    const currentOffset = reset ? 0 : offset;
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(currentOffset) });
    if (q) params.set("q", q);

    const res = await fetch(`/api/recipes?${params}`);
    const data = await res.json();

    setRecipes((prev) => reset ? data.items : [...prev, ...data.items]);
    setOffset(currentOffset + data.items.length);
    setHasMore(data.hasMore);
    setListLoading(false);
    loadingRef.current = false;
  }, [offset]);

  // 초기 로드 + Top 재료 조회
  useEffect(() => {
    loadRecipes(true, appliedQ);
    fetch("/api/ingredients/top?limit=5")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setTopIngredients(data.map((d) => d.name)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 무한스크롤 감지
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadRecipes(false, appliedQ);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, appliedQ, loadRecipes]);

  // ── URL 파싱 ──
  const handleParse = async () => {
    if (!url.trim()) return;
    setParseError("");
    setParseState("loading");
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), extraText: extraText.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 크레딧 부족(402) 또는 기타 서버 오류 메시지 그대로 표시
        throw new Error(data.error ?? "레시피를 가져오지 못했어요. URL을 확인해 주세요.");
      }
      setPreview(data);
      setParseState("preview");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "레시피를 가져오지 못했어요. URL을 확인해 주세요.");
      setParseState("idle");
    }
  };

  // ── 레시피 저장 ──
  const handleSave = async () => {
    if (!preview) return;
    setParseState("saving");
    await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...preview, sourceUrl: url.trim() }),
    });
    setUrl("");
    setExtraText("");
    setPreview(null);
    setParseState("idle");
    // 목록 맨 위부터 새로고침
    setOffset(0);
    loadRecipes(true, appliedQ);
  };

  // ── 검색 적용 ──
  const handleSearch = () => {
    setAppliedQ(searchQ);
    setOffset(0);
    loadRecipes(true, searchQ);
  };

  const handleSearchReset = () => {
    setSearchQ("");
    setAppliedQ("");
    setOffset(0);
    loadRecipes(true, "");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("레시피를 삭제할까요?")) return;
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const activeFilters = !!appliedQ;

  return (
    <div className="space-y-5">

      {/* ── 1. URL 입력 섹션 ── */}
      <section className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="YouTube, 블로그, SNS 레시피 URL 붙여넣기..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && parseState === "idle" && handleParse()}
              disabled={parseState === "loading" || parseState === "saving"}
              className="w-full px-4 py-2.5 pr-9 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
            />
            {url && parseState === "idle" && (
              <button
                onClick={() => { setUrl(""); setExtraText(""); setParseError(""); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                aria-label="입력 지우기"
              >
                ✕
              </button>
            )}
          </div>
          {parseState === "idle" || parseState === "loading" ? (
            <button
              onClick={handleParse}
              disabled={parseState === "loading" || !url.trim()}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              {parseState === "loading" ? "분석 중..." : "분석하기"}
            </button>
          ) : null}
        </div>

        {/* 인스타그램 URL 감지 시 캡션 직접 입력 안내 */}
        {parseState === "idle" && url.includes("instagram.com") && (
          <div className="space-y-1.5">
            <p className="text-xs text-stone-500">
              📋 인스타그램은 자동 분석이 제한될 수 있어요. 게시물 캡션(재료·조리법 텍스트)을 아래에 붙여넣으면 더 정확하게 분석해요.
            </p>
            <textarea
              placeholder="게시물 캡션 붙여넣기 (선택)"
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            />
          </div>
        )}

        {parseError && <p className="text-red-500 text-xs">{parseError}</p>}

        {/* 파싱 중 인디케이터 */}
        {parseState === "loading" && (
          <div className="flex items-center gap-2 text-stone-500 text-sm py-2">
            <span className="animate-spin inline-block">🍳</span>
            <span>레시피 분석 중... (10~20초 정도 걸려요)</span>
          </div>
        )}

        {/* 파싱 결과 미리보기 */}
        {parseState === "preview" && preview && (
          <div className="border border-orange-200 rounded-xl bg-orange-50/40 p-4 space-y-3">
            {/* 썸네일 + 제목 */}
            <div className="flex gap-3">
              {preview.thumbnailUrl && (
                <img
                  src={resolveImageUrl(preview.thumbnailUrl)}
                  alt=""
                  className="w-20 h-14 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={preview.title}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                  className="w-full text-sm font-semibold text-stone-800 bg-transparent border-b border-stone-200 focus:outline-none focus:border-orange-400 pb-0.5"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs text-stone-500">
                  <span>{SOURCE_LABELS[preview.sourceType] ?? preview.sourceType}</span>
                  {preview.cookTime && <span>⏱ {preview.cookTime}</span>}
                  {preview.servings && <span>👥 {preview.servings}</span>}
                  {preview.difficulty && (
                    <span>{DIFFICULTY_ICONS[preview.difficulty] ?? "⚪"} {DIFFICULTY_LABELS[preview.difficulty] ?? preview.difficulty}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 재료 / 단계 요약 */}
            <div className="flex gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1">
                <span className="text-base">🥕</span>
                재료 {preview.ingredients.length}개
              </span>
              <span className="flex items-center gap-1">
                <span className="text-base">📋</span>
                조리 단계 {preview.steps.length}개
              </span>
              {preview.ingredients.length === 0 && preview.steps.length === 0 && (
                <span className="text-amber-600">재료·조리법 정보를 가져오지 못했어요</span>
              )}
            </div>

            {/* 태그 */}
            {preview.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {preview.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">#{t}</span>
                ))}
              </div>
            )}

            {/* 저장 / 취소 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setParseState("idle"); setPreview(null); setExtraText(""); }}
                className="flex-1 py-2 border border-stone-200 text-stone-600 text-sm rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {isSaving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. 검색 토글 섹션 ── */}
      <section>
        <button
          onClick={() => setSearchOpen((o) => !o)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <span className="text-base font-bold text-stone-800">등록된 레시피</span>
          <span className="text-stone-400 text-sm">{searchOpen ? "▲" : "▼"}</span>
          {activeFilters && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">필터 적용 중</span>
          )}
        </button>

        {searchOpen && (
          <div className="mt-3 bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
            {/* 검색창 + 버튼 한 줄 */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="레시피 제목 또는 재료 검색..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleSearch}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                검색
              </button>
            </div>

            {/* 자주 쓰는 재료 Top 5 태그 */}
            {topIngredients.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-400">자주 쓰는 재료</span>
                <button
                  onClick={handleSearchReset}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
                    !appliedQ
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  전체
                </button>
                {topIngredients.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSearchQ(name);
                      setAppliedQ(name);
                      setOffset(0);
                      loadRecipes(true, name);
                    }}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors cursor-pointer ${
                      appliedQ === name
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 3. 레시피 목록 ── */}
      <section>
        {recipes.length === 0 && !listLoading ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🥘</div>
            <p className="text-stone-500 text-sm">
              {activeFilters ? "검색 결과가 없습니다." : "아직 저장된 레시피가 없어요. 위에 URL을 붙여넣어 첫 레시피를 추가해보세요!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-stone-100 overflow-hidden">
                  {recipe.thumbnailUrl ? (
                    <img
                      src={resolveImageUrl(recipe.thumbnailUrl)}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-semibold text-stone-800 text-sm leading-tight line-clamp-2 flex-1">
                      {recipe.title}
                    </h2>
                    <button
                      onClick={(e) => handleDelete(recipe.id, e)}
                      className="text-stone-300 hover:text-red-400 transition-colors text-xs shrink-0 mt-0.5 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {recipe.description && (
                    <p className="text-stone-500 text-xs line-clamp-2 mb-2">{recipe.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[recipe.sourceType] ?? "bg-stone-100 text-stone-600"}`}>
                      {SOURCE_LABELS[recipe.sourceType] ?? recipe.sourceType}
                    </span>
                    {recipe.cookTime && <span className="text-stone-500">⏱ {recipe.cookTime}</span>}
                    {recipe.servings && <span className="text-stone-500">👥 {recipe.servings}</span>}
                    {recipe.difficulty && (
                      <span className="text-stone-500">{DIFFICULTY_ICONS[recipe.difficulty] ?? "⚪"} {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</span>
                    )}
                  </div>
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 무한스크롤 센티넬 */}
        <div ref={sentinelRef} className="h-8" />
        {listLoading && (
          <div className="text-center py-4 text-stone-400 text-sm">불러오는 중...</div>
        )}
        {!hasMore && recipes.length > 0 && (
          <p className="text-center text-stone-300 text-xs py-4">모든 레시피를 불러왔어요</p>
        )}
      </section>
    </div>
  );
}
