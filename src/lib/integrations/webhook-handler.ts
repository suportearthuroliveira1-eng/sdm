import "server-only";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getFlag } from "@/lib/server/settings";
import { log } from "@/lib/server/log";
import { processStoredEvent, WEBHOOKS } from "./purchases";

/**
 * Fluxo comum: confere assinatura → salva em events (idempotente pelo id do
 * evento) → processa se a flag estiver ligada. Flag desligada: guarda e responde 202.
 */
export async function handlePurchaseWebhook(provider: "hubla" | "hotmart", req: Request, secret: string | undefined) {
  const hook = WEBHOOKS[provider];
  const raw = await req.text();
  if (raw.length > 512_000) return NextResponse.json({ error: "payload grande demais" }, { status: 413 });
  if (!hook.verify(req.headers, raw, secret)) {
    log("warn", "webhook com assinatura inválida", { provider });
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }
  const ev = hook.parse(payload, req.headers);
  if (!ev) return NextResponse.json({ error: "evento não reconhecido" }, { status: 422 });

  const [row] = await db()
    .insert(schema.events)
    .values({ tipo: `${provider}.${ev.tipo}`, fonte: provider, externalId: ev.externalId, payload: payload as object })
    .onConflictDoNothing({ target: [schema.events.fonte, schema.events.externalId] })
    .returning();
  if (!row) return NextResponse.json({ ok: true, duplicado: true });

  if (!(await getFlag(hook.flag))) {
    return NextResponse.json({ ok: true, evento: row.code, processado: false, motivo: "flag desligada" }, { status: 202 });
  }
  const result = await processStoredEvent(row.id);
  return NextResponse.json({ ok: result.status !== "erro", evento: row.code, ...result });
}
