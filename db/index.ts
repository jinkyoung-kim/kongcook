// 작업일: 2026-04-28 / 수정: 2026-04-29
// SQLite DB 연결 및 Drizzle ORM 인스턴스
// Railway 배포 시 RAILWAY_VOLUME_MOUNT_PATH 환경변수로 영구 볼륨 경로 지정

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Railway 볼륨이 있으면 해당 경로, 없으면 프로젝트 루트
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? process.cwd();
const DB_PATH = path.join(DATA_DIR, "kongcook.db");

const sqlite = new Database(DB_PATH);

// WAL 모드 활성화 (성능 향상)
sqlite.pragma("journal_mode = WAL");

// 앱 시작 시 테이블 자동 생성 (IF NOT EXISTS — 멱등)
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

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
