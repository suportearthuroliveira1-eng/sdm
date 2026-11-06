"use client";

import { useState, useTransition } from "react";
import { CopyButton } from "@/components/pasta/copy-button";
import { Spinner } from "@/components/ux/submit-button";
import { senhaProvisoriaAction } from "@/lib/actions/admin";

/** Gera senha provisória pra aluna (mostra uma vez), com opção de mandar por e-mail. */
export function SenhaProvisoria({ studentId, emailOk }: { studentId: string; emailOk: boolean }) {
  const [pend, start] = useTransition();
  const [r, setR] = useState<Awaited<ReturnType<typeof senhaProvisoriaAction>> | null>(null);
  const gerar = (email: boolean) => start(async () => setR(await senhaProvisoriaAction(studentId, email).catch(() => ({ error: "Sem conexão." }))));
  return (
    <div className="acd gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-semibold">Senha provisória</h2>
        <p className="m-0 text-sm text-muted">Pra quem comprou e não recebeu o acesso. Ela entra com o e-mail e essa senha, e o app pede pra criar a definitiva no primeiro acesso. A senha anterior deixa de valer.</p>
      </div>
      {r?.senha ? (
        <div className="flex flex-col gap-2 rounded-xl border border-ok-line bg-ok-bg p-3 text-ok-text">
          <span className="text-sm">Senha provisória (aparece só agora):</span>
          <span className="font-mono text-2xl font-bold tracking-wider">{r.senha}</span>
          {r.emailEnviado ? <span className="text-sm font-bold">E-mail enviado pra ela.</span> : null}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={r.senha} label="Copiar senha" />
            <CopyButton text={r.mensagem ?? ""} label="Copiar mensagem pro WhatsApp" />
          </div>
        </div>
      ) : null}
      {r?.error ? <span role="alert" className="text-sm text-danger">{r.error}</span> : null}
      <div className="flex flex-wrap gap-2">
        {emailOk ? <button type="button" className="ab1" disabled={pend} onClick={() => gerar(true)}>{pend ? <Spinner /> : null} Gerar e mandar por e-mail</button> : null}
        <button type="button" className={emailOk ? "ab2" : "ab1"} disabled={pend} onClick={() => gerar(false)}>{pend && !emailOk ? <Spinner /> : null} Gerar e mostrar aqui</button>
      </div>
      {!emailOk ? <p className="m-0 text-xs text-muted">Pra mandar por e-mail automático, cadastre a chave do Resend em Chaves e variáveis.</p> : null}
    </div>
  );
}
