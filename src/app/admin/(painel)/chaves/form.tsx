"use client";

import { useActionState } from "react";
import { salvarSegredo, type SegredoState } from "@/lib/actions/segredos";
import { Spinner } from "@/components/ux/submit-button";

export function SegredoForm({ k, tem }: { k: string; tem: boolean }) {
  const [st, acao, pend] = useActionState(salvarSegredo, null as SegredoState);
  return (
    <form action={acao} className="flex flex-col gap-2">
      <input type="hidden" name="key" value={k} />
      <label htmlFor={`v-${k}`} className="text-sm font-bold">{tem ? "Trocar a chave" : "Colar a chave"}</label>
      <div className="flex flex-wrap gap-2">
        <input id={`v-${k}`} name="valor" type="password" autoComplete="off" spellCheck={false} placeholder="sk-..." className="ain min-w-0 flex-1 font-mono text-sm" />
        <button className="ab1" disabled={pend}>{pend ? <><Spinner /> Testando...</> : "Salvar e testar"}</button>
        {tem ? (
          <button name="apagar" value="1" className="ab2" disabled={pend}>Apagar do painel</button>
        ) : null}
      </div>
      <p role="status" className="min-h-4 text-sm">{st?.ok ? <span className="text-ok">{st.msg}</span> : st?.erro ? <span className="text-danger">{st.erro}</span> : null}</p>
    </form>
  );
}
