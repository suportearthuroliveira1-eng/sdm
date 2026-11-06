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

describe("webhook Hubla · payloads da doc oficial (v2.0.0)", () => {
  const venda = {
    type: "invoice.payment_succeeded",
    event: {
      product: { id: "inAVzweR0QYw5y03K5mq", name: "Integrações com Webhook 2.0" },
      invoice: { id: "7614b1bb-1d1a-43ba-890c-50d74216eb56", subscriptionId: "d7ab", status: "paid", payer: { firstName: "John", lastName: "Doe", email: "johndoe.payer@example.com", phone: "+5511999999999" } },
      user: { id: "J0k", firstName: "John", lastName: "Doe", email: "John.Doe@hub.la", phone: "+5511988646782" },
    },
    version: "2.0.0",
  };
  it("venda aprovada: libera, com e-mail, nome, telefone, produto e fatura", async () => {
    const { hublaWebhook } = await import("@/lib/integrations/webhooks/hubla");
    const ev = hublaWebhook.parse(venda, new Headers({ "x-hubla-idempotency": "aviso-1" }))!;
    expect(ev.kind).toBe("grant");
    expect(ev.email).toBe("john.doe@hub.la");
    expect(ev.nome).toBe("John Doe");
    expect(ev.whatsapp).toBe("+5511988646782");
    expect(ev.externalProductId).toBe("inAVzweR0QYw5y03K5mq");
    expect(ev.transactionId).toBe("7614b1bb-1d1a-43ba-890c-50d74216eb56");
    expect(ev.externalId).toBe("aviso-1");
  });
  it("sem event.user, usa quem pagou a fatura", async () => {
    const { hublaWebhook } = await import("@/lib/integrations/webhooks/hubla");
    const { user: _u, ...semUser } = venda.event;
    void _u;
    const ev = hublaWebhook.parse({ ...venda, event: semUser }, new Headers())!;
    expect(ev.email).toBe("johndoe.payer@example.com");
    expect(ev.nome).toBe("John Doe");
  });
  it("chargeback chega por invoice.status_updated e tira o acesso; outros status são ignorados", async () => {
    const { hublaWebhook } = await import("@/lib/integrations/webhooks/hubla");
    const cb = { ...venda, type: "invoice.status_updated", event: { ...venda.event, invoice: { ...venda.event.invoice, status: "chargeback" } } };
    expect(hublaWebhook.parse(cb, new Headers())!.kind).toBe("revoke_chargeback");
    const pago = { ...venda, type: "invoice.status_updated" };
    expect(hublaWebhook.parse(pago, new Headers())!.kind).toBe("ignore");
    expect(hublaWebhook.parse({ ...venda, type: "invoice.refunded" }, new Headers())!.kind).toBe("revoke_refund");
    expect(hublaWebhook.parse({ ...venda, type: "customer.member_removed" }, new Headers())!.kind).toBe("revoke_cancel");
    expect(hublaWebhook.parse({ ...venda, type: "customer.member_added" }, new Headers())!.kind).toBe("grant");
  });
});

describe("senha provisória", () => {
  it("passa na regra de senha (8+, letra e número) e não usa caracteres confusos", async () => {
    const { gerarSenhaProvisoria, passwordSchema } = await import("@/lib/domain/password");
    for (let i = 0; i < 50; i++) {
      const s = gerarSenhaProvisoria();
      expect(passwordSchema.safeParse(s).success).toBe(true);
      expect(s).not.toMatch(/[0O1lI]/);
    }
  });
});
