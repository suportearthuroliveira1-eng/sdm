import "server-only";
import { env } from "@/lib/env";
import { enviarEmail } from "@/lib/integrations/email";
import { supabaseAdmin } from "@/lib/supabase/server";
import { log } from "./log";
import { gerarSenhaProvisoria } from "@/lib/domain/password";
export { gerarSenhaProvisoria };

/** Define a senha provisória no login e marca "trocar senha no 1º acesso". Devolve a senha (mostrar/enviar uma vez só). */
export async function definirSenhaProvisoria(authUserId: string): Promise<string> {
  const senha = gerarSenhaProvisoria();
  const { error } = await supabaseAdmin().auth.admin.updateUserById(authUserId, { password: senha, user_metadata: { trocar_senha: true } });
  if (error) throw new Error(`não deu pra definir a senha provisória: ${error.message}`);
  return senha;
}

export function textoAcesso(nome: string, email: string, senha: string) {
  const url = `${env().APP_URL}/app/a01`;
  const primeiro = nome.split(/\s+/)[0] || "";
  return {
    assunto: "Seu acesso ao SDM chegou",
    texto: `Oi, ${primeiro}! Seu acesso ao SDM (Sistema Dólar Mundial) está liberado.\n\nEntre em: ${url}\nE-mail: ${email}\nSenha provisória: ${senha}\n\nNo primeiro acesso o app pede pra você criar a sua senha definitiva.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1e1a2b">
<h2 style="color:#2a2240">Oi, ${primeiro}! Seu acesso ao SDM chegou</h2>
<p>Seu acesso ao <b>SDM (Sistema Dólar Mundial)</b> está liberado.</p>
<table style="background:#f4f0ff;border-radius:12px;padding:16px;width:100%"><tr><td>
<p style="margin:0 0 6px">E-mail: <b>${email}</b></p>
<p style="margin:0">Senha provisória: <b style="font-size:20px;letter-spacing:1px">${senha}</b></p>
</td></tr></table>
<p style="margin:24px 0"><a href="${url}" style="background:#a98bff;color:#140f1f;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold">Entrar no app</a></p>
<p style="color:#6e6878;font-size:13px">No primeiro acesso o app pede pra você criar a sua senha definitiva. Se não foi você que comprou, ignore este e-mail.</p>
</div>`,
  };
}

/** Gera a senha provisória e manda por e-mail. Devolve se enviou (sem e-mail configurado: não troca a senha). */
export async function enviarAcessoPorEmail(a: { authUserId: string; nome: string; email: string }): Promise<{ enviado: boolean; erro?: string }> {
  const { emailConfigurado } = await import("@/lib/integrations/email");
  if (!(await emailConfigurado())) return { enviado: false, erro: "e-mail não configurado" };
  const senha = await definirSenhaProvisoria(a.authUserId);
  const t = textoAcesso(a.nome, a.email, senha);
  const r = await enviarEmail({ para: a.email, assunto: t.assunto, html: t.html, texto: t.texto });
  if (!r.ok) log("warn", "acesso não enviado por e-mail", { erro: r.erro });
  return { enviado: r.ok, erro: r.erro };
}
