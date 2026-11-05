import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Saúde do app: confere variáveis e conexão com o banco.
 * Nunca devolve valores de variáveis, só se existem e o tipo do erro.
 */
export async function GET() {
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
