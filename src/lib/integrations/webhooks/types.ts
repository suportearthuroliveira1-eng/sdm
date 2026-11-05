import type { PurchaseKind } from "@/lib/domain/entitlements";

/** Evento de compra normalizado, igual para Hubla e Hotmart. */
export type PurchaseEvent = {
  provider: "hubla" | "hotmart";
  externalId: string; // id do evento (idempotência)
  tipo: string; // tipo original
  kind: PurchaseKind;
  email: string | null;
  nome: string | null;
  whatsapp: string | null;
  externalProductId: string | null;
  transactionId: string | null;
};

export interface PurchaseWebhook {
  provider: "hubla" | "hotmart";
  flag: string; // chave em settings que liga o processamento
  /** Confere a assinatura/token. Nunca loga o segredo. */
  verify(headers: Headers, rawBody: string, secret: string | undefined): boolean;
  parse(payload: unknown, headers: Headers): PurchaseEvent | null;
}
