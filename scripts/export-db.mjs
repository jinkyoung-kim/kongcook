// 작업일: 2026-04-29
// 로컬 SQLite DB 데이터를 JSON으로 내보내는 스크립트
// 사용법: node scripts/export-db.mjs

import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import { join } from "path";

const DB_PATH = join(process.cwd(), "kongcook.db");
const sqlite = new Database(DB_PATH);

const recipes = sqlite.prepare("SELECT * FROM recipes").all();
const ingredients = sqlite.prepare("SELECT * FROM ingredients").all();
const steps = sqlite.prepare("SELECT * FROM steps").all();

const data = { recipes, ingredients, steps };

writeFileSync("scripts/export.json", JSON.stringify(data, null, 2));
console.log(`✅ 내보내기 완료`);
console.log(`   레시피 ${recipes.length}개`);
console.log(`   재료 ${ingredients.length}개`);
console.log(`   단계 ${steps.length}개`);
console.log(`   → scripts/export.json`);

sqlite.close();
