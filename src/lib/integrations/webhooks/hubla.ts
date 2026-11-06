import { createHash } from "node:crypto";
import type { PurchaseKind } from "@/lib/domain/entitlements";
import type { PurchaseWebhook } from "./types";
import { pick, safeEqual, str } from "./util";

/**
 * Webhook da Hubla (v2.0.0), conferido com a doc oficial em 2026-11-06
 * (hubla.gitbook.io/docs/webhooks): token no header x-hubla-token, id do aviso em
 * x-hubla-idempotency, comprador em event.user (ou event.invoice.payer), produto em event.product.id.
 * Liga em Admin → Acessos e webhooks (flag auth_hubla_webhook); token em Admin → Chaves.
 */
export const HUBLA_EVENT_KIND: Record<string, PurchaseKind> = {
  "invoice.payment_succeeded": "grant",
  "customer.member_added": "grant",
  "subscription.activated": "grant",
  "invoice.refunded": "revoke_refund",
  "customer.member_removed": "revoke_cancel",
  "subscription.deactivated": "revoke_cancel",
};

/** invoice.status_updated é o "guarda-chuva": chargeback só chega por ele. */
function tipoComStatus(tipo: string, payload: unknown): PurchaseKind {
  if (tipo === "invoice.status_updated") {
    const st = str(pick(payload, ["event.invoice.status"]));
    if (st === "chargeback") return "revoke_chargeback";
    return "ignore"; // pago/reembolsado já chegam pelos eventos próprios
  }
  return HUBLA_EVENT_KIND[tipo] ?? "ignore";
}

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
      kind: tipoComStatus(tipo, payload),
      email: str(pick(payload, ["event.user.email", "event.invoice.payer.email", "event.customer.email", "event.payer.email", "data.user.email", "user.email"]))?.toLowerCase() ?? null,
      nome:
        str(pick(payload, ["event.user.name", "event.customer.name", "data.user.name"])) ??
        ([pick(payload, ["event.user.firstName"]), pick(payload, ["event.user.lastName"])].filter(Boolean).join(" ") ||
          [pick(payload, ["event.invoice.payer.firstName"]), pick(payload, ["event.invoice.payer.lastName"])].filter(Boolean).join(" ") ||
          null),
      whatsapp: str(pick(payload, ["event.user.phone", "event.invoice.payer.phone", "event.customer.phone", "data.user.phone"])),
      externalProductId: str(pick(payload, ["event.product.id", "event.products.0.id", "data.product.id", "product.id"])),
      transactionId: str(pick(payload, ["event.invoice.id", "event.subscription.id", "data.invoice.id"])),
    };
  },
};
