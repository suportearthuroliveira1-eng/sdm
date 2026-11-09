"use client";

import { useEffect, useState, useTransition } from "react";
import { Icone } from "@/components/ui/icone";
import { avisarQuandoAbrir } from "@/lib/actions/pais-oculto";
import { CeuEstrelado } from "./portao";

type Props = {
  nome: string;
  convite: string;
  preco: string;
  checkoutUrl: string;
  encerrada: boolean;
  restantes: number | null;
  vagas: number | null;
  prazo: string | null;
  jaAvisada: boolean;
  amostra: { sigla: string; nome: string; cor: string }[];
};

const ENTREGA = [
  { t: "O mapa secreto", d: "A IA cruza o que você sabe com mercados que quase ninguém do Brasil enxerga e escolhe 3 pra você.", icone: "globo" },
  { t: "A estratégia secreta", d: "Pra cada país: o segredo, o ângulo que ninguém usa, onde divulgar, os primeiros ganchos e os cuidados.", icone: "escudo" },
  { t: "O produto pronto pra criar", d: "Um toque e a IA monta a ficha, a oferta e o ebook pra esse mercado. Fica salvo na sua aba.", icone: "livro" },
  { t: "Plano de ação em 3 fases", d: "Preparar, testar e crescer, com caixinhas pra marcar o que você já fez.", icone: "passos" },
  { t: "Dossiê em PDF", d: "A estratégia inteira num PDF pra você guardar e consultar quando quiser.", icone: "pagina" },
] as const;

/** Contagem regressiva até o fim da turma (só quando o time define um prazo). */
function useFalta(prazo: string | null) {
  const [agora, setAgora] = useState<number | null>(null);
  useEffect(() => {
    if (!prazo) return;
    const tick = () => setAgora(Date.now());
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [prazo]);
  if (!prazo || agora === null) return null;
  const ms = Math.max(0, new Date(prazo).getTime() - agora);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s, acabou: ms === 0 };
}

/**
 * Prévia do País Oculto pra quem ainda não tem acesso: o castelo trancado, o que tem lá dentro (embaçado),
 * a escassez de verdade (vagas e prazo que o time definiu) e o botão pro checkout.
 */
export function PreviaOculto(p: Props) {
  const [tremeu, setTremeu] = useState(false);
  const [avisada, setAvisada] = useState(p.jaAvisada);
  const [pend, start] = useTransition();
  const falta = useFalta(p.prazo);
  const encerrada = p.encerrada || Boolean(falta?.acabou);
  const ocupadas = p.vagas != null && p.restantes != null ? p.vagas - p.restantes : null;

  const tentarAbrir = () => {
    setTremeu(true);
    setTimeout(() => setTremeu(false), 600);
    document.getElementById("oc-oferta")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* castelo trancado */}
      <section className="oc-ceu relative isolate flex min-h-[420px] flex-col items-center justify-between overflow-hidden rounded-3xl border border-c-amber/30 p-5 text-center">
        <CeuEstrelado />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-c-amber">Só pra convidadas</span>
          <h1 className="oc-titulo m-0 text-[32px] font-extrabold leading-tight">País Oculto</h1>
          <p className="m-0 max-w-xs text-sm text-text-2">{p.convite || `${p.nome}, existem mercados que quase ninguém do Brasil enxerga. Atrás desse portão estão eles e a estratégia pra chegar lá.`}</p>
        </div>
        <button type="button" onClick={tentarAbrir} aria-label="Portão trancado: ver como entrar" className={`relative z-10 my-4 grid size-36 place-items-center rounded-t-full border-4 border-[#3a2f57] ${tremeu ? "oc-treme" : ""}`} style={{ background: "repeating-linear-gradient(90deg, #6b4423 0 10px, #5a3a1e 10px 12px)" }}>
          <span className="oc-fechadura grid size-14 place-items-center rounded-full bg-[#c9a227] text-[#2a1a0e]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </span>
        </button>
        <span className="relative z-10 text-xs font-bold text-c-amber">{tremeu ? "Trancado. A chave está aqui embaixo." : "Toque no portão"}</span>
      </section>

      {/* espiada: cartas embaçadas */}
      <section className="flex flex-col gap-2" aria-label="Uma espiada lá dentro">
        <span className="kk">UMA ESPIADA LÁ DENTRO</span>
        <div className="grid grid-cols-3 gap-2">
          {p.amostra.map((a, i) => (
            <div key={a.sigla} className="oc-revela relative flex aspect-[3/4] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-c-amber/30 bg-surface" style={{ animationDelay: `${i * 150}ms` }}>
              <span className="grid size-11 place-items-center rounded-xl text-sm font-extrabold text-accent-ink blur-[3px]" style={{ background: a.cor }}>{a.sigla}</span>
              <span className="text-xs font-bold blur-[4px]">{a.nome}</span>
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-bg/70 py-1.5 text-[10px] font-bold text-c-amber"><Icone nome="escudo" tamanho={11} /> secreto</span>
            </div>
          ))}
        </div>
      </section>

      {/* o que tem dentro */}
      <section className="flex flex-col gap-2" aria-label="O que você recebe">
        <span className="kk">O QUE VOCÊ RECEBE</span>
        {ENTREGA.map((e, i) => (
          <div key={e.t} className="oc-revela flex gap-3 rounded-2xl border border-line bg-surface p-3.5" style={{ animationDelay: `${200 + i * 120}ms` }}>
            <span className="oc-selo grid size-10 shrink-0 place-items-center rounded-full border-2 border-c-amber/70 text-c-amber" style={{ animationDelay: `${300 + i * 120}ms` }}><Icone nome={e.icone} tamanho={19} /></span>
            <span className="flex flex-col gap-0.5"><span className="font-bold">{e.t}</span><span className="text-[13px] leading-snug text-text-2">{e.d}</span></span>
          </div>
        ))}
      </section>

      {/* oferta */}
      <section id="oc-oferta" className="oc-convite scroll-mt-20 flex flex-col gap-3 rounded-3xl border-[1.5px] border-c-amber/70 p-5" style={{ background: "linear-gradient(160deg, #1a1030, #0b0814)" }}>
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-c-amber">{encerrada ? "Turma fechada" : "Turma aberta"}</span>
        <span className="text-[22px] font-extrabold leading-tight">{encerrada ? "As vagas desta turma acabaram" : "Entre no País Oculto"}</span>
        {!encerrada && p.preco ? <span className="oc-titulo text-[28px] font-extrabold">{p.preco}</span> : null}

        {!encerrada && falta ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-text-2">A turma fecha em</span>
            <div className="grid grid-cols-4 gap-1.5" role="timer" aria-live="off">
              {[["dias", falta.d], ["horas", falta.h], ["min", falta.m], ["seg", falta.s]].map(([r, v]) => (
                <span key={r} className="flex flex-col items-center rounded-xl bg-bg/60 py-2">
                  <span key={String(v)} className="ia-msg text-xl font-extrabold tabular-nums text-c-amber">{String(v).padStart(2, "0")}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted">{r}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!encerrada && p.vagas != null && p.restantes != null ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold"><span className="text-text-2">Vagas desta turma</span><span className="text-c-amber">{p.restantes === 1 ? "Resta 1 vaga" : `Restam ${p.restantes} de ${p.vagas}`}</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line"><div className="ia-barra h-full rounded-full" style={{ width: `${Math.max(4, Math.round(((ocupadas ?? 0) / p.vagas) * 100))}%` }} /></div>
          </div>
        ) : null}

        {!encerrada ? (
          <>
            <a href={p.checkoutUrl} target="_blank" rel="noopener" className="press flex min-h-14 items-center justify-center gap-2 rounded-2xl text-[17px] font-extrabold text-[#2a1a0e] no-underline shadow-[0_0_30px_color-mix(in_srgb,var(--c-amber)_45%,transparent)]" style={{ background: "linear-gradient(135deg, #ffe08a, var(--c-amber), #ffb86b)" }}>
              <Icone nome="carrinho" tamanho={20} /> Quero a chave do País Oculto
            </a>
            <span className="text-center text-xs text-text-2">Compre com o mesmo e-mail do app. O acesso abre sozinho aqui nesta aba logo depois do pagamento.</span>
          </>
        ) : avisada ? (
          <div className="good">Combinado: você está na lista de espera. Quando abrir uma turma nova, você fica sabendo.</div>
        ) : (
          <button type="button" className="b1" disabled={pend} onClick={() => start(async () => { const r = await avisarQuandoAbrir().catch(() => null); if (r?.ok) setAvisada(true); })}>
            {pend ? "Salvando..." : "Me avise quando abrir"}
          </button>
        )}
        <span className="text-center text-[11px] text-muted">A IA não promete resultado: ela mostra o caminho, você decide e faz.</span>
      </section>
    </div>
  );
}
