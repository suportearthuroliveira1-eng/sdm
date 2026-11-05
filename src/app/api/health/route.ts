import { sql } from "drizzle-orm";
import postgres from "postgres";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Saúde do app: confere variáveis e conexão com o banco.
 * Nunca devolve valores de variáveis, só se existem e o tipo do erro.
 */
/** Teste de carga curto: N consultas em paralelo, com limite de tempo. Sem dados sensíveis. */
async function carga(n: number, porta?: string) {
  const url = new URL(env().DATABASE_URL);
  if (porta) url.port = porta;
  const c = postgres(url.toString(), { prepare: false, max: 5, connect_timeout: 8, idle_timeout: 5 });
  const t = Date.now();
  try {
    const r = await Promise.race([
      Promise.all(Array.from({ length: n }, (_, i) => c`select ${i}::int as i, pg_sleep(0.05)`)).then(() => "ok"),
      new Promise<string>((res) => setTimeout(() => res("PRESO"), 12000)),
    ]);
    return { r, ms: Date.now() - t };
  } catch (e) {
    return { r: "erro", ms: Date.now() - t, msg: String((e as Error).message).replace(/postgres(ql)?:\/\/[^\s]+/g, "[url]").slice(0, 200) };
  } finally {
    c.end({ timeout: 1 }).catch(() => {});
  }
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (q.has("carga")) {
    const n = Math.min(Math.max(Number(q.get("carga")) || 20, 1), 40);
    const [atual, sessao] = await Promise.all([carga(n), carga(n, "5432")]);
    return NextResponse.json({ n, porta_atual: new URL(env().DATABASE_URL).port, atual, sessao_5432: sessao }, { headers: { "Cache-Control": "no-store" } });
  }
  const out: Record<string, unknown> = {
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    },
  };
  try {
    env();
    out.envValida = true;
  } catch (e) {
    out.envValida = false;
    out.envErro = e instanceof Error ? e.message : String(e);
  }
  try {
    const r = (await db().execute(sql`select count(*)::int as n from lessons`)) as unknown as { n: number }[];
    out.db = { ok: true, aulas: r[0]?.n };
  } catch (e) {
    const err = e as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    // mensagem sem a URL de conexão
    const msg = String(err.cause?.message ?? err.message ?? e).replace(/postgres(ql)?:\/\/[^\s]+/g, "[url]");
    out.db = { ok: false, code: err.cause?.code ?? err.code, msg: msg.slice(0, 300) };
  }
  const ok = out.envValida === true && (out.db as { ok: boolean }).ok;
  return NextResponse.json(out, { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
