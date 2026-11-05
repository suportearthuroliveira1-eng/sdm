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

/**
 * O driver `postgres` manda várias consultas na mesma conexão (pipelining)
 * quando há mais consultas que conexões. O pooler do Supabase em modo
 * transação (porta 6543) trava com isso: medido em produção, 6+ consultas em
 * paralelo nunca voltavam (telas presas). Em modo sessão (5432, mesmo host)
 * volta em ~0,5 s. Por isso a 6543 do pooler vira 5432. Ver DECISOES ADR-015.
 */
export function urlDoBanco(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543") {
      u.port = "5432";
      return u.toString();
    }
  } catch {
    // URL fora do padrão: usa como veio
  }
  return raw;
}

export function db(): DB {
  if (!g.__sdmDb) {
    // Serverless: o pooler do Supabase fecha conexões paradas e a instância da
    // Vercel "congela" entre pedidos. Sem esses limites, uma conexão morta
    // segura a consulta pra sempre.
    const client = postgres(urlDoBanco(env().DATABASE_URL), {
      prepare: false,
      max: 4,
      idle_timeout: 20,
      max_lifetime: 60 * 5,
      connect_timeout: 10,
    });
    g.__sdmDb = drizzle(client, { schema });
  }
  return g.__sdmDb;
}

export { schema };
