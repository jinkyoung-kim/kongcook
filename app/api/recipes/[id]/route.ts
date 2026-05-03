// 작업일: 2026-04-28 / 수정: 2026-05-03 (DELETE 관리자 인증 추가)
// 레시피 단건 조회(GET) + 삭제(DELETE) API

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { recipes, ingredients, steps } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/recipes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const recipe = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .get();

  if (!recipe) {
    return NextResponse.json({ error: "레시피를 찾을 수 없습니다" }, { status: 404 });
  }

  const ingredientList = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, id))
    .orderBy(ingredients.sortOrder);

  const stepList = await db
    .select()
    .from(steps)
    .where(eq(steps.recipeId, id))
    .orderBy(steps.stepOrder);

  return NextResponse.json({
    ...recipe,
    tags: recipe.tags ? JSON.parse(recipe.tags) : [],
    ingredients: ingredientList,
    steps: stepList,
  });
}

// DELETE /api/recipes/[id] — 관리자만 삭제 가능
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 세션 확인 — 관리자가 아니면 401 반환
  const session = await getSession();
  if (!session?.email) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(ingredients).where(eq(ingredients.recipeId, id));
  await db.delete(steps).where(eq(steps.recipeId, id));
  await db.delete(recipes).where(eq(recipes.id, id));

  return NextResponse.json({ success: true });
}
