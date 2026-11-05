"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { testarLink, type LinkTeste } from "@/lib/actions/pasta";

export function LinkForm({ id, valor, ultimo, produto }: { id: string; valor: string; ultimo: LinkTeste | null; produto: string }) {
  const [state, action, pending] = useActionState(testarLink.bind(null, id), ultimo);
  const [ajuda, setAjuda] = useState(false);
  return (
    <>
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lk" className="lb">Seu link de afiliada</label>
          <input id="lk" name="link" type="url" required defaultValue={valor} placeholder="https://…" className={`in ${state && !state.ok ? "border-danger" : ""}`} />
        </div>
        <button className="b1" disabled={pending}>{pending ? "Testando..." : "Testar meu link"}</button>
      </form>
      {state ? (
        <div className="flex flex-col gap-2" role="status">
          {state.erro ? <p className="m-0 text-sm text-danger">{state.erro}</p> : null}
          {state.checks.map((c) => (
            <div key={c.l} className="flex items-start gap-2.5">
              <span className={`dot size-[22px] text-accent-ink ${c.ok === true ? "bg-ok" : c.ok === false ? "bg-danger" : "bg-warn"}`} aria-hidden>{c.ok === true ? "✓" : c.ok === false ? "!" : "?"}</span>
              <span className="tx">{c.l}</span>
            </div>
          ))}
          <span className="mu">Testado em {new Date(state.testadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
        </div>
      ) : null}
      <button type="button" className="b2" onClick={() => setAjuda((a) => !a)} aria-expanded={ajuda}>Onde acho meu link? {ajuda ? "▴" : "▾"}</button>
      {ajuda ? (
        <div className="cd gap-1.5">
          <span className="tx">1. Entre na [rede de afiliação] com sua conta.</span>
          <span className="tx">2. Procure o {produto} e toque em &quot;Quero ser afiliada&quot; ou &quot;Promover&quot;.</span>
          <span className="tx">3. Copie o link que aparece e cole aqui em cima.</span>
          <span className="mu">[print &quot;onde está o seu link&quot;]</span>
        </div>
      ) : null}
      {state?.ok ? (
        <>
          <div className="good">Link certo. Etapa 1 pronta.</div>
          <Link href={`/app/f02/${id}`} className="b1 no-underline">Próximo: sua estrutura</Link>
        </>
      ) : null}
    </>
  );
}
