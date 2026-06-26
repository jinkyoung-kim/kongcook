// 작업일: 2026-04-28 / 수정: 2026-06-26 (SQLite → PostgreSQL/Neon)
// 레시피 저장소 DB 스키마 정의 (Drizzle ORM + Neon PostgreSQL)

import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";

// 레시피 기본 정보 테이블
export const recipes = pgTable("recipes", {
  id: text("id").primaryKey(), // UUID
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  sourceType: text("source_type").notNull().default("manual"), // youtube | instagram | blog | manual | other
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  servings: text("servings"), // 예: "2인분"
  cookTime: text("cook_time"), // 예: "30분"
  difficulty: text("difficulty"), // easy | medium | hard
  tags: text("tags"), // JSON 배열 문자열: ["비건", "간단"]
  memo: text("memo"),
  rawContent: text("raw_content"),
  createdAt: timestamp("created_at").notNull(),
});

// 재료 테이블 (레시피당 N개)
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: text("amount"),
  category: text("category"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// 조리 순서 테이블 (레시피당 N개)
export const steps = pgTable("steps", {
  id: serial("id").primaryKey(),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  description: text("description").notNull(),
  tip: text("tip"),
});
