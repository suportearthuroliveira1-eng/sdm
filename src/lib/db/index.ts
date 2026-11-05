import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Conexão de servidor (role do DATABASE_URL, ignora RLS).
 * Toda consulta de aluna DEVE filtrar por student_id da sessão (lib/auth).
 *
 * Driver `pg` (não `postgres`): o `postgres` manda várias consultas na mesma
 * conexão (pipelining) e o pooler do Supabase em modo transação (6543) trava
 * com isso — medido em produção: 6+ consultas em paralelo nunca voltavam.
 * O `pg` põe a consulta na fila do Pool e usa uma conexão por vez. O modo
 * sessão (5432) não serve: limite de 15 conexões no total. Ver ADR-015.
 */
type DB = NodePgDatabase<typeof schema>;
const g = globalThis as unknown as { __sdmDb?: DB };

export function db(): DB {
  if (!g.__sdmDb) {
    const pool = new Pool({
      connectionString: env().DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      maxLifetimeSeconds: 60 * 5,
      query_timeout: 25_000,
    });
    pool.on("error", () => {
      // conexão parada que caiu: o Pool descarta e abre outra quando precisar
    });
    g.__sdmDb = drizzle(pool, { schema });
  }
  return g.__sdmDb;
}

export { schema };
