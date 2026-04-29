// 작업일: 2026-04-29
// 자주 등록된 재료 Top N 조회 API
// GET /api/ingredients/top?limit=5

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { sql } from "drizzle-orm";
import { normalizeIngredientName } from "@/lib/ingredients";

export async function GET(req: NextRequest) {
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "5"), 20);

  // 양념 제외하고 전체 조회 후 앱 레벨에서 동의어 정규화 + 재집계
  const rows = await db
    .select({ name: ingredients.name })
    .from(ingredients)
    .where(sql`(${ingredients.category} IS NULL OR ${ingredients.category} != '양념')`);

  // 동의어 정규화 후 카운트 집계
  const countMap = new Map<string, number>();
  for (const row of rows) {
    const normalized = normalizeIngredientName(row.name);
    countMap.set(normalized, (countMap.get(normalized) ?? 0) + 1);
  }

  const result = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json(result);
}
