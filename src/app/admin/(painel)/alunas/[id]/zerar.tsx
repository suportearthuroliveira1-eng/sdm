"use client";

import { useActionState, useState } from "react";
import { zerarAlunaAction } from "@/lib/actions/admin";
import { Spinner } from "@/components/ux/submit-button";

/** Zona de perigo: zerar a aluna (volta pro primeiro acesso). Pede pra digitar ZERAR. */
export function ZerarAluna({ studentId, nome, resumo }: { studentId: string; nome: string; resumo: string }) {
  const [aberto, setAberto] = useState(false);
  const [st, acao, pend] = useActionState(zerarAlunaAction.bind(null, studentId), null as { ok?: boolean; error?: string; msg?: string } | null);
  return (
    <div className="acd gap-3 border-danger/50">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-semibold text-danger">Zerar a aluna</h2>
        <p className="m-0 text-sm text-muted">Apaga tudo o que ela fez no app e ela começa de novo pelo primeiro acesso, como conta nova. Fica o login, o e-mail, os acessos liberados e o papel de admin (se tiver).</p>
        <p className="m-0 text-sm">Hoje: {resumo}</p>
      </div>
      {st?.ok ? <div className="good">{st.msg}</div> : null}
      {!aberto ? (
        <button type="button" className="ab2 self-start border-danger/60 text-danger" onClick={() => setAberto(true)}>Zerar tudo de {nome.split(/\s+/)[0]}</button>
      ) : (
        <form action={acao} className="flex flex-col gap-2">
          <label htmlFor="z-conf" className="text-sm font-bold">Não dá pra desfazer. Digite ZERAR pra confirmar.</label>
          <div className="flex flex-wrap gap-2">
            <input id="z-conf" name="confirmar" autoComplete="off" className="ain max-w-48 font-mono uppercase" placeholder="ZERAR" />
            <button className="ab1 bg-danger" disabled={pend}>{pend ? <><Spinner /> Zerando...</> : "Zerar agora"}</button>
            <button type="button" className="ab2" onClick={() => setAberto(false)} disabled={pend}>Cancelar</button>
          </div>
          {st?.error ? <span role="alert" className="text-sm text-danger">{st.error}</span> : null}
        </form>
      )}
    </div>
  );
}
