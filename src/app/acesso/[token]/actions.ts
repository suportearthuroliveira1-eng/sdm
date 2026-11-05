"use server";

import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth/access-link";
import { env } from "@/lib/env";
import { errMsg, log } from "@/lib/server/log";
import { consumeAccessLink } from "@/lib/server/students";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export type EnterState = { error?: string };

export async function enterWithLink(token: string): Promise<EnterState> {
  const v = await verifyAccessToken(token, env().ACCESS_LINK_SECRET);
  if (!v.ok) {
    return { error: v.reason === "expirado" ? "Esse link venceu. Peça um novo ao time." : "Link inválido." };
  }
  const student = await consumeAccessLink(v.claims.jti, v.claims.sub);
  if (!student) return { error: "Esse link já foi usado ou foi trocado por um novo. Entre com e-mail e senha, ou peça um link novo ao time." };
  if (!student.ativo) redirect("/app/a02");

  try {
    // Cria a sessão sem senha: gera um magic link no servidor e confirma o hash aqui mesmo.
    const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type: "magiclink", email: student.email });
    if (error || !data.properties?.hashed_token) throw error ?? new Error("sem hashed_token");
    const sb = await supabaseServer();
    const res = await sb.auth.verifyOtp({ type: "magiclink", token_hash: data.properties.hashed_token });
    if (res.error) throw res.error;
  } catch (e) {
    log("error", "login por link falhou", { student: student.code, err: errMsg(e) });
    return { error: "Não conseguimos entrar agora. Tente de novo ou fale com o time." };
  }
  redirect("/app/senha?primeiro=1");
}
