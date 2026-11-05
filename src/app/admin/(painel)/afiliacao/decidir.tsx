"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ux/submit-button";
import { decidirAfiliacao } from "@/lib/actions/admin-sdm";

export function Decidir({ pastaId }: { pastaId: string }) {
  const [st, action] = useActionState(decidirAfiliacao.bind(null, pastaId), null as { ok?: boolean; erro?: string } | null);
  if (st?.ok) return <p className="text-sm text-ok">Decisão salva. A aluna vê na hora.</p>;
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor={`lk-${pastaId}`} className="lb text-muted">Link de afiliada dela (pra aprovar)</label>
      <input id={`lk-${pastaId}`} name="link" type="url" placeholder="https://…" className="ain" />
      <label htmlFor={`mt-${pastaId}`} className="lb text-muted">Motivo (pra recusar)</label>
      <input id={`mt-${pastaId}`} name="motivo" className="ain" />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <div className="flex gap-2">
        <SubmitButton className="ab1" name="decisao" value="aprovar" pendente="Salvando...">Aprovar</SubmitButton>
        <SubmitButton className="ab2 text-danger" name="decisao" value="recusar" pendente="Salvando...">Recusar</SubmitButton>
      </div>
    </form>
  );
}
