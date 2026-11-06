import "server-only";
import { getSetting } from "@/lib/server/settings";
import { log } from "@/lib/server/log";
import { segredo } from "@/lib/server/segredos";

/** E-mail transacional pelo Resend (chave em Admin → Chaves). Sem chave: não envia e avisa. */
export async function emailConfigurado() {
  return Boolean(await segredo("RESEND_API_KEY"));
}

export async function enviarEmail(m: { para: string; assunto: string; html: string; texto: string }): Promise<{ ok: boolean; erro?: string }> {
  const chave = await segredo("RESEND_API_KEY");
  if (!chave) return { ok: false, erro: "e-mail não configurado (Admin → Chaves → Resend)" };
  const de = (await getSetting<string | null>("email_remetente", null)) || "SDM <onboarding@resend.dev>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [m.para], subject: m.assunto, html: m.html, text: m.texto }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) {
      const e = (await r.text()).slice(0, 300);
      log("error", "resend recusou o e-mail", { status: r.status, e });
      return { ok: false, erro: `Resend respondeu ${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    log("error", "resend falhou", { err: String(e) });
    return { ok: false, erro: "falha de rede ao enviar o e-mail" };
  }
}
