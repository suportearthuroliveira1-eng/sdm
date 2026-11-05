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
    // Serverless: o pooler do Supabase fecha conexões paradas e a instância da
    // Vercel "congela" entre pedidos. Sem esses limites, uma conexão morta
    // segura a consulta pra sempre (tela presa em "Enviando...").
    const client = postgres(env().DATABASE_URL, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      max_lifetime: 60 * 5,
      connect_timeout: 10,
    });
    g.__sdmDb = drizzle(client, { schema });
  }
  return g.__sdmDb;
}

export { schema };
