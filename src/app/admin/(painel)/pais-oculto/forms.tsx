"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { liberarOculto, removerOculto, salvarOpcoesOculto, salvarVendaOculto } from "@/lib/actions/pais-oculto";

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

export function VendaForm({ aberta, checkoutUrl, preco, vagas, fechaEm, hublaProdutos }: { aberta: boolean; checkoutUrl: string; preco: string; vagas: number | null; fechaEm: string; hublaProdutos: string }) {
  const [st, action, pending] = useActionState(salvarVendaOculto, null as S);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="aberta" defaultChecked={aberta} className="size-4 accent-[var(--accent)]" /> Turma aberta (mostra o botão de comprar)
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2"><label htmlFor="v-url" className="lb text-muted">Link do checkout (Hubla)</label><input id="v-url" name="checkoutUrl" defaultValue={checkoutUrl} className="ain" placeholder="https://pay.hub.la/..." inputMode="url" /></div>
        <div className="flex flex-col gap-1"><label htmlFor="v-preco" className="lb text-muted">Preço que aparece</label><input id="v-preco" name="preco" defaultValue={preco} maxLength={60} className="ain" placeholder="R$ 497 ou 12x de R$ 49,70" /></div>
        <div className="flex flex-col gap-1"><label htmlFor="v-vagas" className="lb text-muted">Vagas da turma (vazio = sem limite)</label><input id="v-vagas" name="vagas" type="number" min={1} defaultValue={vagas ?? ""} className="ain" /></div>
        <div className="flex flex-col gap-1"><label htmlFor="v-fecha" className="lb text-muted">A turma fecha em (horário de Brasília, vazio = sem prazo)</label><input id="v-fecha" name="fechaEm" type="datetime-local" defaultValue={fechaEm} className="ain" /></div>
        <div className="flex flex-col gap-1"><label htmlFor="v-hubla" className="lb text-muted">ID do produto na Hubla (libera sozinho na compra)</label><input id="v-hubla" name="hublaProdutos" defaultValue={hublaProdutos} className="ain" placeholder="separe por vírgula se tiver mais de um" /></div>
      </div>
      <p className="mu m-0 text-xs">Com o ID da Hubla preenchido, a compra libera o País Oculto na hora (mesmo webhook das outras vendas). Conta nova ganha acesso ao app e senha provisória por e-mail. Reembolso ou chargeback tira o acesso.</p>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      {st?.msg ? <span className="text-sm text-ok">{st.msg}</span> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? "Salvando..." : "Salvar venda"}</button>
    </form>
  );
}
