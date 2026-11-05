import type { PurchaseKind } from "@/lib/domain/entitlements";
import type { PurchaseWebhook } from "./types";
import { pick, safeEqual, str } from "./util";

/**
 * Adaptador Hotmart (webhook 2.0), mesma interface da Hubla.
 * DESLIGADO por flag (settings.auth_hotmart_webhook=false) — teste A/B Hubla × Hotmart.
 * Autenticação pelo header X-HOTMART-HOTTOK. Conferir na doc antes de ligar.
 */
export const HOTMART_EVENT_KIND: Record<string, PurchaseKind> = {
  PURCHASE_APPROVED: "grant",
  PURCHASE_COMPLETE: "grant",
  PURCHASE_REFUNDED: "revoke_refund",
  PURCHASE_CHARGEBACK: "revoke_chargeback",
  PURCHASE_CANCELED: "revoke_cancel",
  PURCHASE_PROTEST: "ignore",
};

export const hotmartWebhook: PurchaseWebhook = {
  provider: "hotmart",
  flag: "auth_hotmart_webhook",
  verify(headers, _raw, secret) {
    if (!secret) return false;
    const token = headers.get("x-hotmart-hottok") ?? "";
    return token.length > 0 && safeEqual(token, secret);
  },
  parse(payload) {
    const tipo = str(pick(payload, ["event"]));
    const externalId = str(pick(payload, ["id"]));
    if (!tipo || !externalId) return null;
    return {
      provider: "hotmart",
      externalId,
      tipo,
      kind: HOTMART_EVENT_KIND[tipo] ?? "ignore",
      email: str(pick(payload, ["data.buyer.email"]))?.toLowerCase() ?? null,
      nome: str(pick(payload, ["data.buyer.name"])),
      whatsapp: str(pick(payload, ["data.buyer.checkout_phone", "data.buyer.phone"])),
      externalProductId: str(pick(payload, ["data.product.id"])),
      transactionId: str(pick(payload, ["data.purchase.transaction"])),
    };
  },
};
