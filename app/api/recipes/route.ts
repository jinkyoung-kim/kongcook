// 작업일: 2026-04-28
// 레시피 목록 조회(GET) + 저장(POST) API

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recipes, ingredients, steps } from "@/db/schema";
import { eq, like, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

import { normalizeIngredientName } from "@/lib/ingredients";

// GET /api/recipes?q=검색어(제목+재료통합)&tag=태그&limit=12&offset=0
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "12"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let query = db
    .select({
      id: recipes.id,
      title: recipes.title,
      sourceUrl: recipes.sourceUrl,
      sourceType: recipes.sourceType,
      thumbnailUrl: recipes.thumbnailUrl,
      description: recipes.description,
      servings: recipes.servings,
      cookTime: recipes.cookTime,
      difficulty: recipes.difficulty,
      tags: recipes.tags,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .$dynamic();

  if (q) {
    // 제목 OR 재료명 통합 검색
    const matchingByIngredient = await db
      .selectDistinct({ recipeId: ingredients.recipeId })
      .from(ingredients)
      .where(like(ingredients.name, `%${q}%`));

    const ingredientIds = matchingByIngredient.map((r) => r.recipeId);

    if (ingredientIds.length > 0) {
      query = query.where(
        sql`(${like(recipes.title, `%${q}%`)} OR ${recipes.id} IN (${sql.join(ingredientIds.map((id) => sql`${id}`), sql`, `)}))`
      );
    } else {
      query = query.where(like(recipes.title, `%${q}%`));
    }
  }

  if (tag) query = query.where(like(recipes.tags, `%${tag}%`));

  const result = await query
    .orderBy(sql`${recipes.createdAt} DESC`)
    .limit(limit + 1)  // +1로 다음 페이지 존재 여부 확인
    .offset(offset);

  const hasMore = result.length > limit;
  const items = result.slice(0, limit).map((r) => ({
    ...r,
    tags: r.tags ? JSON.parse(r.tags) : [],
  }));

  return NextResponse.json({ items, hasMore });
}

// POST /api/recipes - 레시피 저장
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    sourceUrl,
    sourceType = "manual",
    thumbnailUrl,
    description,
    servings,
    cookTime,
    difficulty,
    tags = [],
    memo,
    rawContent,
    ingredients: ingredientList = [],
    steps: stepList = [],
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title은 필수입니다" }, { status: 400 });
  }

  const id = randomUUID();
  const now = new Date();

  // better-sqlite3는 동기 방식이므로 순차 insert 사용
  await db.insert(recipes).values({
    id,
    title,
    sourceUrl,
    sourceType,
    thumbnailUrl,
    description,
    servings,
    cookTime,
    difficulty,
    tags: JSON.stringify(tags),
    memo,
    rawContent,
    createdAt: now,
  });

  if (ingredientList.length > 0) {
    await db.insert(ingredients).values(
      ingredientList.map(
        (ing: { name: string; amount?: string; category?: string }, idx: number) => ({
          recipeId: id,
          name: normalizeIngredientName(ing.name),
          amount: ing.amount,
          category: ing.category,
          sortOrder: idx,
        })
      )
    );
  }

  if (stepList.length > 0) {
    await db.insert(steps).values(
      stepList.map((step: { stepOrder: number; description: string; tip?: string }) => ({
        recipeId: id,
        stepOrder: step.stepOrder,
        description: step.description,
        tip: step.tip,
      }))
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
