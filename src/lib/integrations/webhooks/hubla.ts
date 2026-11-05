import { createHash } from "node:crypto";
import type { PurchaseKind } from "@/lib/domain/entitlements";
import type { PurchaseWebhook } from "./types";
import { pick, safeEqual, str } from "./util";

/**
 * Webhook da Hubla. DESLIGADO por padrão (settings.auth_hubla_webhook=false).
 *
 * ATENÇÃO: nomes de evento, caminhos do payload e o header de autenticação
 * foram escritos sem acesso à doc oficial da Hubla (rede bloqueada no
 * ambiente de desenvolvimento). Antes de ligar a flag, conferir na doc da Hubla
 * e ajustar HUBLA_EVENT_KIND, os caminhos em parse() e o header em verify().
 * Pendência registrada em docs/ESTADO.md.
 */
export const HUBLA_EVENT_KIND: Record<string, PurchaseKind> = {
  "invoice.payment_succeeded": "grant",
  "subscription.activated": "grant",
  "customer.member_added": "grant",
  "invoice.refunded": "revoke_refund",
  "invoice.chargeback": "revoke_chargeback",
  "subscription.deactivated": "revoke_cancel",
  "customer.member_removed": "revoke_cancel",
};

export const hublaWebhook: PurchaseWebhook = {
  provider: "hubla",
  flag: "auth_hubla_webhook",
  verify(headers, _raw, secret) {
    if (!secret) return false;
    const token = headers.get("x-hubla-token") ?? "";
    return token.length > 0 && safeEqual(token, secret);
  },
  parse(payload, headers) {
    const tipo = str(pick(payload, ["type", "event_type", "event.type"]));
    if (!tipo) return null;
    const externalId =
      str(pick(payload, ["id", "event_id", "event.id"])) ??
      headers.get("x-hubla-idempotency") ??
      createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    return {
      provider: "hubla",
      externalId,
      tipo,
      kind: HUBLA_EVENT_KIND[tipo] ?? "ignore",
      email: str(pick(payload, ["event.user.email", "event.customer.email", "event.payer.email", "data.user.email", "user.email"]))?.toLowerCase() ?? null,
      nome:
        str(pick(payload, ["event.user.name", "event.customer.name", "data.user.name"])) ??
        ([pick(payload, ["event.user.firstName"]), pick(payload, ["event.user.lastName"])].filter(Boolean).join(" ") || null),
      whatsapp: str(pick(payload, ["event.user.phone", "event.customer.phone", "data.user.phone"])),
      externalProductId: str(pick(payload, ["event.product.id", "event.products.0.id", "data.product.id", "product.id"])),
      transactionId: str(pick(payload, ["event.invoice.id", "event.subscription.id", "data.invoice.id"])),
    };
  },
};
