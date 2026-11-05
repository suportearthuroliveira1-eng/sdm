import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Janela fixa no Postgres. Suficiente para login e rotas de IA neste volume.
 * Retorna ok=false e quando volta (retryAt) se estourou.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const rows = await db().execute<{ count: number; window_start: Date }>(sql`
    INSERT INTO rate_limits (key, count, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSec}) THEN now() ELSE rate_limits.window_start END
    RETURNING count, window_start
  `);
  const row = rows.rows[0];
  const count = Number(row?.count ?? 0);
  const start = row ? new Date(row.window_start) : new Date();
  return { ok: count <= limit, count, retryAt: new Date(start.getTime() + windowSec * 1000) };
}
