// 작업일: 2026-04-28
// DB 초기화 스크립트 - 테이블 생성 (마이그레이션 대신 직접 실행)

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "kongcook.db");
const sqlite = new Database(DB_PATH);

sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_url TEXT,
    source_type TEXT NOT NULL DEFAULT 'manual',
    thumbnail_url TEXT,
    description TEXT,
    servings TEXT,
    cook_time TEXT,
    difficulty TEXT,
    tags TEXT,
    memo TEXT,
    raw_content TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount TEXT,
    category TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    tip TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
  CREATE INDEX IF NOT EXISTS idx_steps_recipe_id ON steps(recipe_id);
`);

console.log("✅ DB 테이블 생성 완료:", DB_PATH);
sqlite.close();
