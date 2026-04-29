// 작업일: 2026-04-29
// 로컬 DB 데이터를 Railway 서버로 이전하는 임시 import API
// ⚠️ 데이터 이전 완료 후 이 파일 삭제 필요
// POST /api/admin/import { secret, recipes, ingredients, steps }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { recipes, ingredients, steps } from "@/db/schema";

// 간단한 비밀키로 무단 접근 방지
const IMPORT_SECRET = process.env.IMPORT_SECRET ?? "kongcook-import-2026";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.secret !== IMPORT_SECRET) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  const { recipes: recipeList, ingredients: ingredientList, steps: stepList } = body;

  let importedRecipes = 0;
  let importedIngredients = 0;
  let importedSteps = 0;
  const errors: string[] = [];

  // 레시피 insert (중복 무시)
  for (const r of recipeList) {
    try {
      await db.insert(recipes).values({
        id: r.id,
        title: r.title,
        sourceUrl: r.source_url,
        sourceType: r.source_type,
        thumbnailUrl: r.thumbnail_url,
        description: r.description,
        servings: r.servings,
        cookTime: r.cook_time,
        difficulty: r.difficulty,
        tags: r.tags,
        memo: r.memo,
        rawContent: r.raw_content,
        createdAt: new Date(r.created_at),
      }).onConflictDoNothing();
      importedRecipes++;
    } catch (e) {
      errors.push(`recipe ${r.id}: ${e}`);
    }
  }

  // 재료 insert
  for (const ing of ingredientList) {
    try {
      await db.insert(ingredients).values({
        recipeId: ing.recipe_id,
        name: ing.name,
        amount: ing.amount,
        category: ing.category,
        sortOrder: ing.sort_order ?? 0,
      }).onConflictDoNothing();
      importedIngredients++;
    } catch (e) {
      errors.push(`ingredient ${ing.id}: ${e}`);
    }
  }

  // 단계 insert
  for (const step of stepList) {
    try {
      await db.insert(steps).values({
        recipeId: step.recipe_id,
        stepOrder: step.step_order,
        description: step.description,
        tip: step.tip,
      }).onConflictDoNothing();
      importedSteps++;
    } catch (e) {
      errors.push(`step ${step.id}: ${e}`);
    }
  }

  return NextResponse.json({
    success: true,
    imported: { recipes: importedRecipes, ingredients: importedIngredients, steps: importedSteps },
    errors,
  });
}
