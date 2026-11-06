import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { statusForKind } from "@/lib/domain/entitlements";
import { getFlag } from "@/lib/server/settings";
import { createStudent, findStudentByEmail, issueAccessLink, upsertEntitlements } from "@/lib/server/students";
import { errMsg, log } from "@/lib/server/log";
import { hotmartWebhook } from "./webhooks/hotmart";
import { hublaWebhook } from "./webhooks/hubla";
import type { PurchaseEvent, PurchaseWebhook } from "./webhooks/types";
import { whatsappSender } from "./whatsapp";
import { enviarAcessoPorEmail } from "@/lib/server/senha-provisoria";

export const WEBHOOKS: Record<"hubla" | "hotmart", PurchaseWebhook> = { hubla: hublaWebhook, hotmart: hotmartWebhook };

export type ProcessResult = { status: "processado" | "ignorado" | "flag_desligada" | "erro"; detalhe?: string };

/** Aplica um evento normalizado: compra libera, reembolso/chargeback/cancelamento revogam. */
export async function applyPurchase(ev: PurchaseEvent): Promise<ProcessResult> {
  const status = statusForKind(ev.kind);
  if (!status) return { status: "ignorado", detalhe: `tipo ${ev.tipo} sem ação` };
  if (!ev.email) return { status: "erro", detalhe: "evento sem e-mail" };
  if (!ev.externalProductId) return { status: "erro", detalhe: "evento sem produto" };

  const map = await db().query.hublaProductMap.findFirst({
    where: and(
      eq(schema.hublaProductMap.provider, ev.provider),
      eq(schema.hublaProductMap.externalProductId, ev.externalProductId),
      eq(schema.hublaProductMap.ativo, true),
    ),
  });
  if (!map) return { status: "erro", detalhe: `produto ${ev.externalProductId} não está no mapa (AD08)` };

  if (status === "active") {
    const { student, created } = await createStudent({
      nome: ev.nome ?? ev.email.split("@")[0]!,
      email: ev.email,
      whatsapp: ev.whatsapp ?? undefined,
      pais: undefined,
      acessos: [map.produto],
    });
    await upsertEntitlements(student.id, [map.produto], ev.provider, "active", ev.transactionId ?? undefined);
    // conta nova: senha provisória por e-mail (ela cria a definitiva no 1º acesso)
    let entrega = "";
    if (created && student.authUserId) {
      const r = await enviarAcessoPorEmail({ authUserId: student.authUserId, nome: student.nome, email: student.email }).catch((e) => ({ enviado: false, erro: errMsg(e) }));
      entrega = r.enviado ? " · acesso enviado por e-mail" : ` · acesso NÃO enviado (${r.erro}): gere a senha em Admin → Alunas`;
    }
    if (created && map.produto === "sdm" && student.whatsapp && (await getFlag("whatsapp_auto_send"))) {
      const link = await issueAccessLink(student.id);
      await whatsappSender().send({ to: student.whatsapp, text: link.message });
    }
    return { status: "processado", detalhe: `${student.code} +${map.produto}${entrega}` };
  }

  const student = await findStudentByEmail(ev.email);
  if (!student) return { status: "ignorado", detalhe: "aluna não existe" };
  await upsertEntitlements(student.id, [map.produto], ev.provider, status, ev.transactionId ?? undefined);
  return { status: "processado", detalhe: `${student.code} ${map.produto}=${status}` };
}

/** Reprocessa um evento já salvo em `events` (AD08). */
export async function processStoredEvent(id: string): Promise<ProcessResult> {
  const row = await db().query.events.findFirst({ where: eq(schema.events.id, id) });
  if (!row) return { status: "erro", detalhe: "evento não encontrado" };
  const hook = WEBHOOKS[row.fonte as "hubla" | "hotmart"];
  if (!hook) return { status: "erro", detalhe: "fonte desconhecida" };
  if (!(await getFlag(hook.flag))) return { status: "flag_desligada" };
  const ev = hook.parse(row.payload, new Headers());
  let result: ProcessResult;
  try {
    result = ev ? await applyPurchase(ev) : { status: "erro", detalhe: "payload não reconhecido" };
  } catch (e) {
    result = { status: "erro", detalhe: errMsg(e) };
  }
  await db()
    .update(schema.events)
    .set({
      processado: result.status === "processado" || result.status === "ignorado",
      erro: result.status === "erro" ? (result.detalhe ?? "erro") : null,
      tentativas: row.tentativas + 1,
      processadoEm: new Date(),
    })
    .where(eq(schema.events.id, id));
  log(result.status === "erro" ? "error" : "info", "evento de compra", { evt: row.code, fonte: row.fonte, ...result });
  return result;
}
