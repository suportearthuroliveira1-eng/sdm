import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Conexão de servidor (role do DATABASE_URL, ignora RLS).
 * Toda consulta de aluna DEVE filtrar por student_id da sessão (lib/auth).
 */
type DB = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __sdmDb?: DB };

export function db(): DB {
  if (!g.__sdmDb) {
    const client = postgres(env().DATABASE_URL, { prepare: false, max: 5 });
    g.__sdmDb = drizzle(client, { schema });
  }
  return g.__sdmDb;
}

export { schema };
