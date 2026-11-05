import { describe, expect, it } from "vitest";
import { hublaWebhook } from "@/lib/integrations/webhooks/hubla";
import { hotmartWebhook } from "@/lib/integrations/webhooks/hotmart";

describe("webhook Hubla", () => {
  it("confere o token", () => {
    expect(hublaWebhook.verify(new Headers({ "x-hubla-token": "seg" }), "", "seg")).toBe(true);
    expect(hublaWebhook.verify(new Headers({ "x-hubla-token": "outro" }), "", "seg")).toBe(false);
    expect(hublaWebhook.verify(new Headers(), "", "seg")).toBe(false);
    expect(hublaWebhook.verify(new Headers({ "x-hubla-token": "seg" }), "", undefined)).toBe(false);
  });
  it("normaliza compra e reembolso", () => {
    const buy = hublaWebhook.parse({ id: "e1", type: "invoice.payment_succeeded", event: { product: { id: "P1" }, user: { email: "A@X.com", name: "Ana" } } }, new Headers());
    expect(buy).toMatchObject({ externalId: "e1", kind: "grant", email: "a@x.com", nome: "Ana", externalProductId: "P1" });
    const ref = hublaWebhook.parse({ id: "e2", type: "invoice.refunded", event: { product: { id: "P1" }, user: { email: "a@x.com" } } }, new Headers());
    expect(ref?.kind).toBe("revoke_refund");
    expect(hublaWebhook.parse({ id: "e3", type: "algo.novo" }, new Headers())?.kind).toBe("ignore");
  });
  it("id estável quando o evento não traz id", () => {
    const p = { type: "invoice.payment_succeeded", event: {} };
    expect(hublaWebhook.parse(p, new Headers())?.externalId).toBe(hublaWebhook.parse(p, new Headers())?.externalId);
  });
});

describe("webhook Hotmart", () => {
  it("normaliza", () => {
    const ev = hotmartWebhook.parse({ id: "h1", event: "PURCHASE_CHARGEBACK", data: { buyer: { email: "b@x.com", name: "Bia" }, product: { id: 123 }, purchase: { transaction: "T9" } } }, new Headers());
    expect(ev).toMatchObject({ kind: "revoke_chargeback", email: "b@x.com", externalProductId: "123", transactionId: "T9" });
    expect(hotmartWebhook.verify(new Headers({ "x-hotmart-hottok": "k" }), "", "k")).toBe(true);
  });
});
