// 작업일: 2026-04-29
// export.json 데이터를 Railway 서버로 전송하는 스크립트
// 사용법: node scripts/push-to-railway.mjs

import { readFileSync } from "fs";

const RAILWAY_URL = "https://kongcook-production.up.railway.app";
const IMPORT_SECRET = "kongcook-import-2026";

const data = JSON.parse(readFileSync("scripts/export.json", "utf-8"));

console.log(`📦 전송 중...`);
console.log(`   레시피 ${data.recipes.length}개`);
console.log(`   재료 ${data.ingredients.length}개`);
console.log(`   단계 ${data.steps.length}개`);

const res = await fetch(`${RAILWAY_URL}/api/admin/import`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ secret: IMPORT_SECRET, ...data }),
});

const result = await res.json();

if (result.success) {
  console.log(`\n✅ 이전 완료!`);
  console.log(`   레시피 ${result.imported.recipes}개`);
  console.log(`   재료 ${result.imported.ingredients}개`);
  console.log(`   단계 ${result.imported.steps}개`);
  if (result.errors.length > 0) {
    console.log(`\n⚠️ 오류 ${result.errors.length}건:`, result.errors);
  }
} else {
  console.error("❌ 실패:", result);
}
