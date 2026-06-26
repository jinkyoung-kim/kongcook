// 작업일: 2026-06-26
// Drizzle Kit 설정 — Neon PostgreSQL (drizzle-kit push 용)

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
