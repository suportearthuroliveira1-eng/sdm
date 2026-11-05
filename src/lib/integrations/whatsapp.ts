import { log } from "@/lib/server/log";

/** Envio de WhatsApp. Provedor [a definir]; em dev usa o adaptador de log. */
export interface WhatsAppSender {
  name: string;
  send(msg: { to: string; text: string }): Promise<{ ok: boolean; id?: string; error?: string }>;
}

export const logWhatsApp: WhatsAppSender = {
  name: "log",
  async send({ to }) {
    // Não loga o texto (contém o link de acesso).
    log("info", "whatsapp (log) mensagem simulada", { to: to.replace(/\d(?=\d{4})/g, "*") });
    return { ok: true, id: `log-${Date.now()}` };
  },
};

/** Adaptador do provedor real — [provedor a definir]. Lança até ser implementado. */
export const pendingProviderWhatsApp: WhatsAppSender = {
  name: "pendente",
  async send() {
    return { ok: false, error: "provedor de WhatsApp ainda não definido" };
  },
};

export function whatsappSender(): WhatsAppSender {
  const p = process.env.WHATSAPP_PROVIDER ?? "log";
  return p === "log" ? logWhatsApp : pendingProviderWhatsApp;
}
