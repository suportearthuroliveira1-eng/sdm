"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { canEnterApp } from "@/lib/domain/entitlements";
import { whatsappSender } from "@/lib/integrations/whatsapp";
import { rateLimit } from "@/lib/server/rate-limit";
import { getFlag } from "@/lib/server/settings";
import { findStudentByEmail, issueAccessLink } from "@/lib/server/students";
import { enviarAcessoPorEmail } from "@/lib/server/senha-provisoria";
import { emailConfigurado } from "@/lib/integrations/email";
import { supabaseAdmin } from "@/lib/supabase/server";

export type TicketState = { ok: boolean; error?: string; msg?: string };

async function ipKey() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

const resendInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  whatsapp: z.string().trim().max(30).optional(),
});

/**
 * "Reenviar meu acesso". Com envio automático ligado e WhatsApp cadastrado,
 * manda um link novo pro número CADASTRADO (nunca pro digitado). Senão, vira
 * pedido pro time. A resposta é a mesma nos dois casos (não revela cadastro).
 */
export async function requestResend(_p: TicketState, form: FormData): Promise<TicketState> {
  const parsed = resendInput.safeParse({ email: form.get("email"), whatsapp: form.get("whatsapp") || undefined });
  if (!parsed.success) return { ok: false, error: "Confira o e-mail da compra." };
  const rl = await rateLimit(`resend:${await ipKey()}`, 5, 3600);
  if (!rl.ok) return { ok: false, error: "Você já pediu várias vezes. Aguarde o time." };

  const { email, whatsapp } = parsed.data;
  const student = await findStudentByEmail(email);
  let sent = false;
  // e-mail com senha provisória: só pra conta que ainda não entrou ou que ainda está com a provisória
  // (assim ninguém troca a senha de quem já usa o app)
  if (student?.ativo && student.authUserId && (await emailConfigurado()) && (await rateLimit(`resend-mail:${email}`, 3, 3600)).ok) {
    const ents = await db().query.entitlements.findMany({ where: eq(schema.entitlements.studentId, student.id) });
    const u = (await supabaseAdmin().auth.admin.getUserById(student.authUserId)).data.user;
    const pendente = !student.ultimoAcesso || (u?.user_metadata as { trocar_senha?: boolean } | undefined)?.trocar_senha === true;
    if (canEnterApp(ents) && pendente) sent = (await enviarAcessoPorEmail({ authUserId: student.authUserId, nome: student.nome, email: student.email }).catch(() => ({ enviado: false }))).enviado;
  }
  if (!sent && student?.ativo && student.whatsapp && (await getFlag("whatsapp_auto_send"))) {
    const ents = await db().query.entitlements.findMany({ where: eq(schema.entitlements.studentId, student.id) });
    if (canEnterApp(ents)) {
      const link = await issueAccessLink(student.id);
      sent = (await whatsappSender().send({ to: student.whatsapp, text: link.message })).ok;
    }
  }
  if (!sent) {
    await db().insert(schema.supportTickets).values({
      studentId: student?.id ?? null,
      emailContato: email,
      texto: `[A02 reenviar acesso] WhatsApp informado: ${whatsapp ?? "—"}`,
    });
  }
  return { ok: true, msg: "Pedido recebido. Se esse e-mail tiver compra aprovada, o acesso chega no seu e-mail (confira o spam). Se não chegar, o time te chama." };
}

const ticketInput = z.object({ email: z.string().trim().toLowerCase().email(), texto: z.string().trim().min(5).max(2000) });

export async function openAccessTicket(_p: TicketState, form: FormData): Promise<TicketState> {
  const parsed = ticketInput.safeParse({ email: form.get("email"), texto: form.get("texto") });
  if (!parsed.success) return { ok: false, error: "Confira o e-mail e escreva o que aconteceu." };
  const rl = await rateLimit(`ticket:${await ipKey()}`, 5, 3600);
  if (!rl.ok) return { ok: false, error: "Você já mandou várias mensagens. Aguarde a resposta do time." };
  const student = await findStudentByEmail(parsed.data.email);
  await db().insert(schema.supportTickets).values({ studentId: student?.id ?? null, emailContato: parsed.data.email, texto: `[A02 falar com o time] ${parsed.data.texto}` });
  return { ok: true, msg: "Recebemos. O time responde no seu e-mail ou WhatsApp." };
}
