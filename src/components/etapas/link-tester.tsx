"use client";

import { useActionState } from "react";
import { testarCheckout } from "@/lib/actions/caminhos";
import { SubmitButton } from "@/components/ux/submit-button";

/** Testa um link de verdade no servidor (abre, segue redirecionamentos, sem IP interno). */
export function LinkTester({ pastaId, url, label = "Testar link", campo = false, rotulo = "Link" }: { pastaId: string; url?: string; label?: string; campo?: boolean; rotulo?: string }) {
  const [st, action] = useActionState(testarCheckout.bind(null, pastaId), null as { ok?: boolean; erro?: string; final?: string; status?: number } | null);
  return (
    <form action={action} className="flex flex-col gap-2">
      {campo ? (
        <>
          <label htmlFor={`lt-${pastaId}`} className="lb">{rotulo}</label>
          <input id={`lt-${pastaId}`} name="url" type="url" required defaultValue={url} placeholder="https://…" className="in" />
        </>
      ) : (
        <input type="hidden" name="url" value={url} />
      )}
      <SubmitButton className={campo ? "b1" : "b2"} pendente="Abrindo o link...">{label}</SubmitButton>
      {st?.ok ? <div className="good" role="status">O link abre (resposta {st.status}). Chega em {st.final ? new URL(st.final).hostname : ""}.</div> : null}
      {st?.erro ? <p role="alert" className="m-0 text-sm text-danger">{st.erro}</p> : null}
    </form>
  );
}
