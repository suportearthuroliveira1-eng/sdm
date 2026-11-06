"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { liberarOculto, removerOculto, salvarOpcoesOculto } from "@/lib/actions/pais-oculto";

type S = { ok?: boolean; erro?: string; msg?: string } | null;

export function LiberarForm() {
  const [st, action, pending] = useActionState(liberarOculto, null as S);
  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="oc-emails" className="sr-only">E-mails</label>
      <textarea id="oc-emails" name="emails" className="ta min-h-28" placeholder={"maria@email.com\njoana@email.com"} />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      {st?.msg ? <span className="text-sm text-ok">{st.msg}</span> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? "Liberando..." : "Liberar acesso"}</button>
    </form>
  );
}

export function RemoverBotao({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [p, start] = useTransition();
  return (
    <button type="button" className="ab2 min-h-9 shrink-0 px-3 text-xs" disabled={p} onClick={() => start(async () => { await removerOculto(studentId); router.refresh(); })}>
      {p ? "..." : "Tirar"}
    </button>
  );
}

export function OpcoesForm({ ligado, convite, paises }: { ligado: boolean; convite: string; paises: { k: string; nome: string; idioma: string; moeda: string; ligado: boolean }[] }) {
  const [st, action, pending] = useActionState(salvarOpcoesOculto, null as S);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="ligado" defaultChecked={ligado} className="size-4 accent-[var(--accent)]" /> País Oculto ligado (desligado: some pra todo mundo)
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor="oc-convite" className="lb text-muted">Frase do convite no Início (vazio = padrão)</label>
        <input id="oc-convite" name="convite" defaultValue={convite} maxLength={200} className="ain" placeholder="Mercados escondidos e uma estratégia secreta, feita pela IA pra você." />
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="lb mb-1 text-muted">Países que a IA pode escolher</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {paises.map((p) => (
            <label key={p.k} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm has-[:checked]:border-accent">
              <input type="checkbox" name="pais" value={p.k} defaultChecked={p.ligado} className="size-4 accent-[var(--accent)]" />
              <span><b>{p.nome}</b> <span className="text-muted">· {p.idioma} · {p.moeda}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      {st?.msg ? <span className="text-sm text-ok">{st.msg}</span> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? "Salvando..." : "Salvar opções"}</button>
    </form>
  );
}
