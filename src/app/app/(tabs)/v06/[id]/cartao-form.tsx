"use client";

import { useActionState } from "react";
import { salvarCartao } from "@/lib/actions/pasta";

export function CartaoForm({ id, valor }: { id: string; valor: string }) {
  const [state, action, pending] = useActionState(salvarCartao.bind(null, id), null as { ok?: boolean } | null);
  return (
    <form action={action} className="cd gap-2">
      <span className="kk">CARTÃO · AULA 3.7</span>
      <label htmlFor="cp" className="lb">Esse produto ajuda quem...</label>
      <textarea id="cp" name="cartao" defaultValue={valor} maxLength={500} className="ta" placeholder="Com as suas palavras" />
      <button className="b2" disabled={pending}>{pending ? "Salvando..." : "Salvar cartão"}</button>
      <span role="status" className="h-4 text-xs text-ok">{state?.ok ? "Salvo" : ""}</span>
    </form>
  );
}
