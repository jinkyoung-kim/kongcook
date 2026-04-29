// 작업일: 2026-04-28
// 레시피 저장소 DB 스키마 정의 (Drizzle ORM + SQLite)

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// 레시피 기본 정보 테이블
export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(), // UUID
  title: text("title").notNull(),
  sourceUrl: text("source_url"), // 원본 URL
  sourceType: text("source_type").notNull().default("manual"), // youtube | instagram | blog | manual | other
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  servings: text("servings"), // 예: "2인분"
  cookTime: text("cook_time"), // 예: "30분"
  difficulty: text("difficulty"), // easy | medium | hard
  tags: text("tags"), // JSON 배열 문자열: ["비건", "간단"]
  memo: text("memo"), // 개인 메모
  rawContent: text("raw_content"), // 스크래핑한 원문 (파싱 재시도용)
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// 재료 테이블 (레시피당 N개)
export const ingredients = sqliteTable("ingredients", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: text("amount"), // 예: "1/2모"
  category: text("category"), // 채소 | 육류 | 해산물 | 유제품 | 양념 | 기타
  sortOrder: integer("sort_order").notNull().default(0),
});

// 조리 순서 테이블 (레시피당 N개)
export const steps = sqliteTable("steps", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  description: text("description").notNull(),
  tip: text("tip"), // 팁 (optional)
});
