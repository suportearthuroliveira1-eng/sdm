"use client";

import { useActionState, useState } from "react";
import { Notice } from "@/components/ui/screen";
import { openAccessTicket, requestResend, type TicketState } from "./actions";

export function ResendForm() {
  const [state, action, pending] = useActionState(requestResend, { ok: false } as TicketState);
  if (state.ok) return <Notice tone="ok">{state.msg}</Notice>;
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="em2" className="lb">E-mail da compra</label>
        <input id="em2" name="email" type="email" required autoComplete="email" className="in" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="wa" className="lb">WhatsApp com código do país</label>
        <input id="wa" name="whatsapp" type="tel" autoComplete="tel" className="in" placeholder="+1 000 000 0000" />
      </div>
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <button className="b1" disabled={pending}>{pending ? "Enviando..." : "Reenviar meu acesso"}</button>
    </form>
  );
}

export function SupportBox() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(openAccessTicket, { ok: false } as TicketState);
  return (
    <div className="cd">
      <span className="text-sm font-bold">Ainda não deu certo?</span>
      <span className="mu text-[13px]">Pode ser que a compra tenha sido feita com outro e-mail. O time confere pra você.</span>
      {state.ok ? (
        <Notice tone="ok">{state.msg}</Notice>
      ) : open ? (
        <form action={action} className="mt-1.5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="s-email" className="lb">Seu e-mail</label>
            <input id="s-email" name="email" type="email" required className="in" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="s-texto" className="lb">O que aconteceu</label>
            <textarea id="s-texto" name="texto" required minLength={5} className="ta" placeholder="Ex.: comprei com outro e-mail" />
          </div>
          {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
          <button className="b2" disabled={pending}>{pending ? "Enviando..." : "Enviar pro time"}</button>
        </form>
      ) : (
        <button type="button" className="b2" onClick={() => setOpen(true)}>Falar com o time</button>
      )}
    </div>
  );
}
