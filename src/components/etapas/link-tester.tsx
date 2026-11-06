"use client";

import { useActionState } from "react";
import { confirmarCheckout, testarCheckout } from "@/lib/actions/caminhos";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SubmitButton } from "@/components/ux/submit-button";

/** Testa um link de verdade no servidor (abre, segue redirecionamentos, sem IP interno). */
export function LinkTester({ pastaId, url, label = "Testar link", campo = false, rotulo = "Link", permitirConfirmar = false }: { pastaId: string; url?: string; label?: string; campo?: boolean; rotulo?: string; permitirConfirmar?: boolean }) {
  const [st, action] = useActionState(testarCheckout.bind(null, pastaId), null as { ok?: boolean; erro?: string; final?: string; status?: number } | null);
  const router = useRouter();
  const [conf, start] = useTransition();
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
      {st?.erro && permitirConfirmar ? (
        <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface-2 p-3">
          <span className="text-sm">Alguns sites de pagamento bloqueiam o teste automático. Abra o link no seu celular: se aparecer a página de pagamento, ele está certo.</span>
          <button type="button" className="b2 self-start" disabled={conf} onClick={() => start(async () => { const r = await confirmarCheckout(pastaId); if (r.ok) router.refresh(); })}>
            {conf ? "Salvando..." : "Abri no celular e está certo: seguir"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
