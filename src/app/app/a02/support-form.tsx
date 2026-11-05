"use client";

import { useActionState } from "react";
import { Notice } from "@/components/ui/screen";
import { openAccessTicket, type TicketState } from "./actions";

export function SupportForm() {
  const [state, action, pending] = useActionState(openAccessTicket, { ok: false } as TicketState);
  if (state.ok) return <Notice tone="ok">Recebemos. O time responde no seu e-mail ou WhatsApp.</Notice>;
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h2 className="font-semibold">Falar com o suporte</h2>
      <div>
        <label htmlFor="s-email" className="label">Seu e-mail</label>
        <input id="s-email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label htmlFor="s-texto" className="label">O que aconteceu</label>
        <textarea id="s-texto" name="texto" required minLength={5} rows={4} className="field py-3" placeholder="Ex.: comprei com outro e-mail, não chegou o código..." />
      </div>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="btn-primary" disabled={pending}>{pending ? "Enviando..." : "Enviar"}</button>
    </form>
  );
}
