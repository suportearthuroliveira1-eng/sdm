"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Icone } from "@/components/ui/icone";
import { IaTrabalhando } from "@/components/ux/ia-trabalhando";
import { abrirPortao, criarProdutoOculto, gerarEstrategia, revelarMapa } from "@/lib/actions/pais-oculto";
import type { PaisOculto } from "@/lib/domain/pais-oculto";
import { fmtPreco, type FaixaPreco, type Moeda } from "@/lib/domain/precos";
import { CeuEstrelado, PortaoCastelo } from "./portao";

type Bi = { x: string; pt: string };
type MapaPais = { k: string; por_que_voce: string; vantagem: string; primeiro_passo: string };
export type Estrategia = {
  segredo: string;
  produto: { nome_provisorio: string; publico: Bi; dor: Bi; promessa: Bi; por_que_vende: string; formato: string };
  angulo: { titulo: string; explicacao: string };
  oferta: { bonus: string[]; garantia: string };
  onde_divulgar: { canal: string; como: string }[];
  plano: { fase: string; quando: string; acoes: string[] }[];
  ganchos: Bi[];
  onde_receber: string;
  cuidados: string[];
};

type Props = {
  nome: string;
  catalogo: PaisOculto[];
  jaAbriu: boolean;
  mapa: { paises: MapaPais[]; segredo_geral: string } | null;
  estrategias: Record<string, Estrategia>;
  precos: Record<Moeda, FaixaPreco>;
};

/** A área secreta inteira: portão → mapa secreto (cartas que viram) → dossiê da estratégia. */
export function PaisOcultoApp({ nome, catalogo, jaAbriu, mapa, estrategias, precos }: Props) {
  const router = useRouter();
  const [dentro, setDentro] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [revelando, startMapa] = useTransition();
  const [gerando, startEst] = useTransition();
  const [criando, startCriar] = useTransition();

  const pedirMapa = (deNovo: boolean) =>
    startMapa(async () => {
      setErro("");
      const r = await revelarMapa(deNovo).catch(() => ({ erro: "Sem conexão. Tente de novo." }));
      if (r.erro) return setErro(r.erro);
      setSel(null);
      router.refresh();
    });
  const pedirEstrategia = (k: string, deNovo = false) =>
    startEst(async () => {
      setErro("");
      setSel(k);
      if (estrategias[k] && !deNovo) return;
      const r = await gerarEstrategia(k, deNovo).catch(() => ({ erro: "Sem conexão. Tente de novo." }));
      if (r.erro) return setErro(r.erro);
      router.refresh();
    });
  const criar = (k: string) =>
    startCriar(async () => {
      setErro("");
      const r = await criarProdutoOculto(k).catch(() => ({ erro: "Sem conexão. Tente de novo.", pastaId: undefined }));
      if (r.erro || !r.pastaId) return setErro(r.erro ?? "Não deu certo.");
      router.push(`/app/p/${r.pastaId}/ficha`);
    });

  useEffect(() => {
    if (dentro && sel) document.getElementById("oc-dossie")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [dentro, sel, estrategias]);

  if (!dentro) return <PortaoCastelo nome={nome} jaAbriu={jaAbriu} onAbrir={() => void abrirPortao().catch(() => null)} onEntrar={() => setDentro(true)} />;

  const pais = (k: string) => catalogo.find((c) => c.k === k);
  const est = sel ? estrategias[sel] : undefined;
  const pSel = sel ? pais(sel) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <section className="oc-ceu oc-revela relative isolate overflow-hidden rounded-3xl border border-c-amber/30 p-5">
        <CeuEstrelado n={26} />
        <div className="relative flex items-center gap-4">
          <svg className="oc-bussola shrink-0" width="64" height="64" viewBox="0 0 64 64" aria-hidden>
            <circle cx="32" cy="32" r="29" fill="none" stroke="var(--c-amber)" strokeWidth="2" strokeDasharray="3 5" />
            <path d="M32 8 L38 32 L32 56 L26 32 Z" fill="var(--c-amber)" />
            <path d="M32 8 L38 32 L26 32 Z" fill="#fff4d6" />
            <circle cx="32" cy="32" r="3.5" fill="#2a1a0e" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-c-amber">O mapa secreto</span>
            <h1 className="oc-titulo m-0 text-2xl font-extrabold">País Oculto</h1>
            <p className="m-0 text-sm text-text-2">A IA cruza o que você sabe com mercados que quase ninguém do Brasil enxerga.</p>
          </div>
        </div>
        {!mapa ? (
          <button type="button" onClick={() => pedirMapa(false)} disabled={revelando} className="press relative mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-extrabold text-[#2a1a0e]" style={{ background: "linear-gradient(135deg, #ffe08a, var(--c-amber), #ffb86b)" }}>
            <Icone nome="globo" tamanho={20} /> {revelando ? "Revelando..." : "Revelar os meus países ocultos"}
          </button>
        ) : (
          <p className="oc-revela relative mt-4 mb-0 rounded-2xl border border-c-amber/30 bg-bg/50 p-3 text-[14px] font-semibold leading-snug text-text">{mapa.segredo_geral}</p>
        )}
      </section>

      {mapa ? (
        <section className="flex flex-col gap-3" aria-label="Seus países ocultos">
          <div className="grid gap-3 md:grid-cols-3">
            {mapa.paises.map((m, i) => {
              const c = pais(m.k);
              if (!c) return null;
              return <CartaPais key={m.k} i={i} p={c} m={m} ativo={sel === m.k} onAbrir={() => pedirEstrategia(m.k)} temEstrategia={Boolean(estrategias[m.k])} />;
            })}
          </div>
          <button type="button" className="b3 self-center text-sm" onClick={() => pedirMapa(true)} disabled={revelando}>Revelar outros países</button>
        </section>
      ) : null}

      {erro ? <div role="alert" className="warn">{erro}</div> : null}

      {est && pSel ? <Dossie key={sel} p={pSel} e={est} faixa={precos[pSel.moedaPreco]} moeda={pSel.moedaPreco} criando={criando} onCriar={() => criar(pSel.k)} onOutra={() => pedirEstrategia(pSel.k, true)} gerando={gerando} /> : null}

      <IaTrabalhando ativo={revelando} titulo="A IA está abrindo o mapa secreto" passos={["Lendo o seu diagnóstico", "Olhando os idiomas que você entende", "Procurando mercados pouco disputados", "Cruzando com os seus assuntos", "Escolhendo os 3 melhores pra você"]} duracao={14} />
      <IaTrabalhando ativo={gerando} titulo={`Montando a estratégia secreta${pSel ? `: ${pSel.nome}` : ""}`} passos={["Estudando o jeito de comprar desse país", "Achando o ângulo que ninguém usa", "Criando o produto ideal pra você", "Desenhando o plano em 3 fases", "Escrevendo os primeiros ganchos", "Conferindo: nada inventado"]} duracao={25} />
    </div>
  );
}

/** Carta do país: começa virada (névoa e cadeado) e vira sozinha, uma depois da outra. */
function CartaPais({ i, p, m, ativo, onAbrir, temEstrategia }: { i: number; p: PaisOculto; m: MapaPais; ativo: boolean; onAbrir: () => void; temEstrategia: boolean }) {
  const [virou, setVirou] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVirou(true), 500 + i * 650);
    return () => clearTimeout(t);
  }, [i]);
  return (
    <div className={`oc-flip ${virou ? "oc-virou" : ""}`}>
      <div className="oc-flip-in grid min-h-[300px]">
        {/* frente: fechada */}
        <div className="oc-face relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-c-amber/40 oc-ceu [grid-area:1/1]">
          <CeuEstrelado n={12} />
          <span className="oc-fechadura relative grid size-14 place-items-center rounded-full bg-[#c9a227] text-[#2a1a0e]"><Icone nome="escudo" tamanho={26} /></span>
          <span className="relative text-sm font-bold text-c-amber">País oculto {i + 1}</span>
        </div>
        {/* verso: revelado */}
        <div className={`oc-face oc-verso flex flex-col gap-2.5 overflow-hidden rounded-3xl [grid-area:1/1] border-[1.5px] bg-surface p-4 ${ativo ? "shadow-[0_0_34px_color-mix(in_srgb,var(--c-amber)_35%,transparent)]" : ""}`} style={{ borderColor: `color-mix(in srgb, ${p.cor} 60%, transparent)`, background: `linear-gradient(160deg, color-mix(in srgb, ${p.cor} 16%, var(--surface)), var(--surface) 55%)` }}>
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-[15px] font-extrabold text-accent-ink" style={{ background: p.cor }}>{p.sigla}</span>
            <span className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: p.cor }}>{i === 0 ? "O melhor pra você" : `Opção ${i + 1}`}</span>
              <span className="text-[17px] font-bold leading-tight">{p.nome}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-bg/60 px-2.5 py-1 text-[11px] font-bold text-text-2">{p.idioma}</span>
            <span className="rounded-full bg-bg/60 px-2.5 py-1 text-[11px] font-bold text-text-2">{p.moeda}</span>
          </div>
          <p className="m-0 text-[13px] leading-snug text-text"><b>Por que você:</b> {m.por_que_voce}</p>
          <p className="m-0 text-[13px] leading-snug text-text-2"><b className="text-c-amber">A vantagem escondida:</b> {m.vantagem}</p>
          <button type="button" onClick={onAbrir} className="b1 mt-auto min-h-11 text-sm">{temEstrategia ? "Ver a estratégia secreta" : "Abrir a estratégia secreta"}</button>
        </div>
      </div>
    </div>
  );
}

/** O dossiê: cada parte aparece com um selo que se abre, uma depois da outra. */
function Dossie({ p, e, faixa, moeda, onCriar, onOutra, criando, gerando }: { p: PaisOculto; e: Estrategia; faixa: FaixaPreco; moeda: Moeda; onCriar: () => void; onOutra: () => void; criando: boolean; gerando: boolean }) {
  const partes: { t: string; icone: Parameters<typeof Icone>[0]["nome"]; corpo: React.ReactNode }[] = [
    { t: "O produto ideal", icone: "livro", corpo: (
      <div className="flex flex-col gap-1.5">
        <span className="text-[17px] font-bold">{e.produto.nome_provisorio}</span>
        <span className="mu">{e.produto.formato}</span>
        <BiLinha r="Pra quem" v={e.produto.publico} />
        <BiLinha r="A dor" v={e.produto.dor} />
        <BiLinha r="A promessa" v={e.produto.promessa} />
        <span className="tx text-sm"><b>Por que vende lá:</b> {e.produto.por_que_vende}</span>
      </div>
    ) },
    { t: "O ângulo que ninguém usa", icone: "olho", corpo: (<><span className="font-bold">{e.angulo.titulo}</span><span className="tx text-sm">{e.angulo.explicacao}</span></>) },
    { t: "A oferta", icone: "etiqueta", corpo: (
      <div className="flex flex-col gap-1.5">
        <span className="tx text-sm"><b>Preço de entrada:</b> {fmtPreco(faixa.sugerido, moeda)} (faixa {fmtPreco(faixa.min, moeda)} a {fmtPreco(faixa.max, moeda)}). Fácil de comprar no impulso.</span>
        {e.oferta.bonus.length ? <span className="tx text-sm"><b>Bônus:</b> {e.oferta.bonus.join(" · ")}</span> : null}
        <span className="tx text-sm"><b>Garantia:</b> {e.oferta.garantia}</span>
      </div>
    ) },
    { t: "Onde divulgar", icone: "megafone", corpo: (<ul className="m-0 flex list-none flex-col gap-1.5 p-0">{e.onde_divulgar.map((d) => <li key={d.canal} className="text-sm"><b>{d.canal}:</b> <span className="text-text-2">{d.como}</span></li>)}</ul>) },
    { t: "O plano em fases", icone: "passos", corpo: (
      <ol className="m-0 flex list-none flex-col gap-0 p-0">
        {e.plano.map((f, i) => (
          <li key={f.fase} className="relative flex gap-3 pb-3 last:pb-0">
            <span className="flex flex-col items-center"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-c-amber text-xs font-extrabold text-[#2a1a0e]">{i + 1}</span>{i < e.plano.length - 1 ? <span className="w-[2px] flex-1 bg-c-amber/40" /> : null}</span>
            <span className="flex flex-col gap-0.5"><span className="font-bold">{f.fase} <span className="text-xs font-normal text-muted">· {f.quando}</span></span>{f.acoes.map((a) => <span key={a} className="text-[13px] text-text-2">• {a}</span>)}</span>
          </li>
        ))}
      </ol>
    ) },
    { t: "Os primeiros ganchos", icone: "lampada", corpo: (<div className="flex flex-col gap-2">{e.ganchos.map((g) => <span key={g.x} className="rounded-xl bg-surface-2 p-2.5 text-sm"><b>{g.x}</b>{g.pt !== g.x ? <span className="block text-xs text-muted">{g.pt}</span> : null}</span>)}</div>) },
    { t: "Onde receber", icone: "carteira", corpo: <span className="tx text-sm">{e.onde_receber}</span> },
    { t: "Cuidados", icone: "escudo", corpo: (<ul className="m-0 flex list-none flex-col gap-1 p-0">{e.cuidados.map((c) => <li key={c} className="text-sm text-text-2">• {c}</li>)}<li className="text-sm text-text-2">• {p.cuidado}</li></ul>) },
  ];
  return (
    <section id="oc-dossie" className="flex scroll-mt-20 flex-col gap-3" aria-label={`Estratégia secreta: ${p.nome}`}>
      <div className="oc-ceu oc-revela relative isolate overflow-hidden rounded-3xl border border-c-amber/40 p-5">
        <CeuEstrelado n={18} />
        <span className="relative text-[11px] font-bold uppercase tracking-[0.25em] text-c-amber">Estratégia secreta · {p.nome}</span>
        <p className="relative mb-0 mt-2 text-[17px] font-bold leading-snug text-text">{e.segredo}</p>
      </div>
      {partes.map((x, i) => (
        <article key={x.t} className="oc-revela flex gap-3 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: `${250 + i * 220}ms` }}>
          <span className="oc-selo grid size-10 shrink-0 place-items-center rounded-full border-2 border-c-amber/70 text-c-amber" style={{ animationDelay: `${350 + i * 220}ms` }}><Icone nome={x.icone} tamanho={20} /></span>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-c-amber">{x.t}</span>
            {x.corpo}
          </div>
        </article>
      ))}
      <div className="sticky bottom-[calc(64px+max(env(safe-area-inset-bottom),12px))] z-10 -mx-4 flex flex-col gap-2 border-t border-c-amber/30 bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-t-2xl lg:border-x">
        <button type="button" onClick={onCriar} disabled={criando} className="press flex min-h-13 items-center justify-center gap-2 rounded-2xl py-3 text-[16px] font-extrabold text-[#2a1a0e]" style={{ background: "linear-gradient(135deg, #ffe08a, var(--c-amber), #ffb86b)" }}>
          <Icone nome="varinha" tamanho={20} /> {criando ? "Criando..." : "Criar este produto com a IA"}
        </button>
        <button type="button" className="b3 text-sm" onClick={onOutra} disabled={gerando}>Pedir outra estratégia pra {p.nome}</button>
      </div>
    </section>
  );
}

function BiLinha({ r, v }: { r: string; v: Bi }) {
  return (
    <span className="text-sm">
      <b>{r}:</b> <span className="text-text">{v.pt}</span>
      {v.x !== v.pt ? <span className="block text-xs italic text-muted">{v.x}</span> : null}
    </span>
  );
}
