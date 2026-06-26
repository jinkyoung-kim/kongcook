// 작업일: 2026-04-28 / 수정: 2026-06-26 (SQLite → Neon PostgreSQL)
// Neon 서버리스 PostgreSQL 연결 + Drizzle ORM 인스턴스

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
export type DB = typeof db;
