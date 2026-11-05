"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { CopyButton } from "@/components/pasta/copy-button";
import { ItemAcoes } from "@/components/pasta/acoes";
import { Spinner, SubmitButton } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { avaliarIdeia, editarBloco, editarFicha, escolherIdeia } from "@/lib/actions/caminhos";

type R = { ok?: boolean; erro?: string };
type Bi = { x: string; pt: string };

export function EscolherIdeia({ pastaId, idx, escolhida }: { pastaId: string; idx: number; escolhida: boolean }) {
  return (
    <form action={escolherIdeia.bind(null, pastaId, idx)} className="mt-auto">
      <SubmitButton className={escolhida ? "b2 w-full" : "b1 min-h-[46px] text-sm"} pendente="Escolhendo...">{escolhida ? "Escolhida · usar de novo" : "Escolher esta"}</SubmitButton>
    </form>
  );
}

export function AvaliarIdeia({ pastaId }: { pastaId: string }) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const [st, action] = useActionState(async (p: R | null, f: FormData) => {
    const r = await avaliarIdeia(pastaId, p, f);
    if (r.ok) {
      toast("A IA avaliou a sua ideia");
      setAberto(false);
      router.refresh();
    }
    return r;
  }, null as R | null);
  if (!aberto) return <button type="button" className="b3 self-start" onClick={() => setAberto(true)}>Tenho minha própria ideia (a IA avalia)</button>;
  return (
    <form action={action} className="cd gap-2">
      <label htmlFor="ideia" className="lb">Sua ideia de produto</label>
      <textarea id="ideia" name="ideia" required minLength={10} maxLength={1000} className="ta" placeholder="Ex.: um guia de marmitas pra semana inteira pra quem trabalha fora" />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="A IA está avaliando...">Avaliar com a IA</SubmitButton>
    </form>
  );
}

/** Formulário com campos de texto que chama uma ação de IA. */
export function FormIa({ acao, campos, botao, carregando }: { acao: (p: R | null, f: FormData) => Promise<R>; campos: { name: string; label: string; ajuda?: string; valor?: string }[]; botao: string; carregando: string }) {
  const router = useRouter();
  const [st, action] = useActionState(async (p: R | null, f: FormData) => {
    const r = await acao(p, f);
    if (r.ok) {
      toast("Pronto!");
      router.refresh();
    }
    return r;
  }, null as R | null);
  return (
    <form action={action} className="flex flex-col gap-3">
      {campos.map((c) => (
        <div key={c.name} className="flex flex-col gap-1.5">
          <label htmlFor={c.name} className="lb">{c.label}</label>
          {c.ajuda ? <span className="mu">{c.ajuda}</span> : null}
          <textarea id={c.name} name={c.name} defaultValue={c.valor} maxLength={1500} className="ta" />
        </div>
      ))}
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente={carregando}>{botao}</SubmitButton>
    </form>
  );
}

type Ficha = { nome: string; publico: Bi; dor: Bi; promessa: Bi; o_que_e: Bi; provas_reais: string[]; objecoes: Bi[]; nao_prometer: string[]; ganchos: Bi[]; por_que_funciona: string };

export function FichaEditavel({ pastaId, ficha }: { pastaId: string; ficha: Ficha }) {
  const campos: [keyof Ficha, string, string, string][] = [
    ["nome", "Nome", ficha.nome, ""],
    ["publico", "Pra quem é", ficha.publico.x, ficha.publico.pt],
    ["dor", "Dor", ficha.dor.x, ficha.dor.pt],
    ["promessa", "Promessa", ficha.promessa.x, ficha.promessa.pt],
    ["o_que_e", "O que é", ficha.o_que_e.x, ficha.o_que_e.pt],
  ];
  return (
    <div className="flex flex-col gap-2">
      <span className="kk">SUA FICHA</span>
      <dl className="m-0 flex flex-col rounded-2xl border border-line bg-surface">
        {campos.map(([k, l, x, pt]) => <CampoFicha key={k} pastaId={pastaId} campo={k} label={l} x={x} pt={pt} />)}
        <Linha label="Provas reais" v={ficha.provas_reais.length ? ficha.provas_reais.join(" · ") : "Nenhuma (a IA não inventa prova)"} />
        <Linha label="Objeções" v={ficha.objecoes.map((o) => o.pt).join(" · ") || "—"} />
        <Linha label="Não prometer" v={ficha.nao_prometer.join(" · ") || "—"} />
        <Linha label="Ganchos" v={ficha.ganchos.map((g) => g.x).join(" · ")} />
      </dl>
      <div className="cd"><span className="kk">POR QUE FUNCIONA</span><span className="tx">{ficha.por_que_funciona}</span></div>
    </div>
  );
}

function Linha({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex gap-2.5 border-b border-line-3 px-3.5 py-[11px] last:border-0">
      <dt className="w-[110px] flex-none text-xs font-semibold text-muted">{label}</dt>
      <dd className="m-0 flex-1 break-words text-[13px] leading-snug">{v}</dd>
    </div>
  );
}

function CampoFicha({ pastaId, campo, label, x, pt }: { pastaId: string; campo: string; label: string; x: string; pt: string }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(x);
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2.5 border-b border-line-3 px-3.5 py-[11px]">
      <dt className="w-[110px] flex-none text-xs font-semibold text-muted">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        {edit ? (
          <>
            <textarea aria-label={label} value={v} onChange={(e) => setV(e.target.value)} className="ta min-h-16" />
            <div className="flex gap-2">
              <button type="button" className="b1 min-h-10 w-auto px-4 text-sm" disabled={pending} onClick={() => start(async () => { const r = await editarFicha(pastaId, campo, v); if (r.ok) { toast("Campo corrigido"); setEdit(false); router.refresh(); } })}>{pending ? <Spinner /> : "Salvar"}</button>
              <button type="button" className="b3" onClick={() => setEdit(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[13px] leading-snug">{x}</span>
            {pt ? <span className="mu">{pt}</span> : null}
            <button type="button" className="b3 min-h-9 self-start px-0 text-xs" onClick={() => setEdit(true)}>Corrigir este campo</button>
          </>
        )}
      </dd>
    </div>
  );
}

export function OfertaForm({ acao, nome, nomePt, promessa, promessaPt, preco, aprovada, proxima }: { pastaId: string; acao: (p: R | null, f: FormData) => Promise<R>; nome: string; nomePt: string; promessa: string; promessaPt: string; preco: number; aprovada: boolean; proxima: string }) {
  const router = useRouter();
  const [st, action] = useActionState(async (p: R | null, f: FormData) => {
    const r = await acao(p, f);
    if (r.ok) {
      toast("Oferta aprovada");
      router.push(proxima);
    }
    return r;
  }, null as R | null);
  return (
    <form action={action} className="cd gap-2.5 border border-accent">
      <span className="kk">REVISE E APROVE</span>
      <label htmlFor="of-nome" className="lb">Nome do produto</label>
      <input id="of-nome" name="nome" defaultValue={nome} className="in" />
      <span className="mu">{nomePt}</span>
      <label htmlFor="of-prom" className="lb">Promessa</label>
      <textarea id="of-prom" name="promessa" defaultValue={promessa} className="ta min-h-16" />
      <span className="mu">{promessaPt}</span>
      <label htmlFor="of-preco" className="lb">Preço</label>
      <input id="of-preco" name="preco" inputMode="decimal" defaultValue={preco > 0 ? preco : ""} placeholder="ex.: 9" className="in w-40" />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="Aprovando...">{aprovada ? "Salvar e seguir" : "Aprovar a oferta"}</SubmitButton>
    </form>
  );
}

type Bloco = { n: string; oq: string; x: string; pt: string };

export function PaginaEditor({ itemId, status, blocos, formato }: { itemId: string; status: string; blocos: Bloco[]; formato: string }) {
  const router = useRouter();
  const [pt, setPt] = useState(false);
  const [prev, setPrev] = useState<"lista" | "celular" | "computador">("lista");
  const [edit, setEdit] = useState<number | null>(null);
  const [txt, setTxt] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="kk">{formato === "quiz" ? "QUIZ" : formato === "pre" ? "PRÉ-VENDA" : "PÁGINA DE VENDAS"} · {blocos.length} BLOCOS</span>
        <ItemAcoes id={itemId} status={status} />
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Visualização">
        {(["lista", "celular", "computador"] as const).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={prev === v} onClick={() => setPrev(v)} className={`press min-h-11 rounded-[22px] border px-3 text-xs font-semibold ${prev === v ? "border-accent bg-sel text-text" : "border-line-2 text-text-2"}`}>
            {v === "lista" ? "Editar blocos" : v === "celular" ? "Prévia no celular" : "Prévia no computador"}
          </button>
        ))}
        <button type="button" onClick={() => setPt(!pt)} className="press min-h-11 rounded-[22px] border border-line-2 px-3 text-xs font-semibold text-text-2">{pt ? "Ver no idioma de venda" : "Ver tradução"}</button>
      </div>
      {prev === "lista" ? (
        blocos.map((b, i) => (
          <div key={i} className="cd gap-1.5 border border-line">
            <div className="flex items-center justify-between gap-2">
              <span className="kk">{b.n}</span>
              <CopyButton text={b.x} />
            </div>
            {edit === i ? (
              <>
                <textarea aria-label={`Editar ${b.n}`} value={txt} onChange={(e) => setTxt(e.target.value)} className="ta" />
                <div className="flex gap-2">
                  <button type="button" className="b1 min-h-10 w-auto px-4 text-sm" disabled={pending} onClick={() => start(async () => { const r = await editarBloco(itemId, i, txt); if (r.ok) { toast("Bloco salvo"); setEdit(null); router.refresh(); } })}>{pending ? <Spinner /> : "Salvar bloco"}</button>
                  <button type="button" className="b3" onClick={() => setEdit(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <span className="whitespace-pre-line text-[15px] leading-normal">{pt ? b.pt : b.x}</span>
            )}
            <span className="mu">Por que está aqui: {b.oq}</span>
            {edit !== i ? <button type="button" className="b3 min-h-9 self-start px-0 text-xs" onClick={() => { setEdit(i); setTxt(b.x); }}>Editar este bloco</button> : null}
          </div>
        ))
      ) : (
        <div className={`mx-auto w-full overflow-hidden rounded-[22px] border-4 border-line-2 bg-white text-[#1E1A2B] ${prev === "celular" ? "max-w-[375px]" : "max-w-[900px]"}`}>
          <div className="flex flex-col gap-4 p-6">
            {blocos.map((b, i) => {
              const t = pt ? b.pt : b.x;
              const ultimo = i === blocos.length - 1;
              return i === 0 ? (
                <h2 key={i} className="m-0 text-2xl font-bold leading-tight">{t}</h2>
              ) : ultimo ? (
                <span key={i} className="self-center rounded-full bg-[#7C5CE0] px-6 py-3 font-bold text-white">{t}</span>
              ) : (
                <p key={i} className="m-0 whitespace-pre-line leading-relaxed">{t}</p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
