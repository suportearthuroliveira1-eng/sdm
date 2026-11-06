"use client";

import { useEffect, useState } from "react";

/** Mensagens padrão quando a tela não passa as suas. */
const PASSOS_PADRAO = ["Lendo o que você me contou", "Pensando em quem compra", "Escrevendo com cuidado", "Conferindo as regras: nada inventado", "Quase pronto"];

/** Robô da IA (SVG animado). Cores seguem o tema; respeita "reduzir movimento". */
export function Robo({ tamanho = 120, falando = true }: { tamanho?: number; falando?: boolean }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 120 120" aria-hidden className="robo">
      <defs>
        <linearGradient id="robo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--c-teal)" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="112" rx="26" ry="4" fill="var(--accent)" opacity=".18" className="robo-sombra" />
      <g className="robo-corpo">
        <line x1="60" y1="14" x2="60" y2="26" stroke="var(--line-2)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="11" r="5" fill="var(--c-amber)" className="robo-antena" />
        <rect x="26" y="26" width="68" height="50" rx="16" fill="url(#robo-g)" />
        <rect x="34" y="34" width="52" height="34" rx="10" fill="var(--bg)" />
        <g className="robo-olhos">
          <circle cx="49" cy="49" r="5" fill="var(--c-teal)" />
          <circle cx="71" cy="49" r="5" fill="var(--c-teal)" />
        </g>
        <rect x="52" y="59" width="16" height="3" rx="1.5" fill="var(--c-pink)" className={falando ? "robo-boca" : ""} />
        <rect x="36" y="80" width="48" height="24" rx="10" fill="var(--surface-2)" stroke="var(--line-2)" />
        <circle cx="60" cy="92" r="4" fill="var(--c-amber)" className="robo-antena" />
        <rect x="18" y="82" width="12" height="6" rx="3" fill="var(--accent)" className="robo-braco-e" />
        <rect x="90" y="82" width="12" height="6" rx="3" fill="var(--accent)" className="robo-braco-d" />
      </g>
      <g className="robo-brilhos" fill="var(--c-amber)">
        <path d="M14 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="M104 18l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" />
        <path d="M108 58l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" />
      </g>
    </svg>
  );
}

/**
 * Tela de "a IA está trabalhando": robô, o que ela está fazendo agora e progresso.
 * `duracao` é a estimativa em segundos (a barra anda até ~92% nesse tempo e espera a resposta).
 */
export function IaTrabalhando({ ativo, titulo = "A IA está trabalhando", passos = PASSOS_PADRAO, duracao = 15, modo = "tela" }: { ativo: boolean; titulo?: string; passos?: string[]; duracao?: number; modo?: "tela" | "cartao" }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!ativo) return;
    const ini = Date.now();
    const id = setInterval(() => setT((Date.now() - ini) / 1000), 250);
    return () => {
      clearInterval(id);
      setT(0);
    };
  }, [ativo]);
  if (!ativo) return null;
  const pct = Math.min(92, (1 - Math.exp(-t / (duracao / 2.2))) * 100);
  const i = Math.min(passos.length - 1, Math.floor((t / duracao) * passos.length));
  const corpo = (
    <div className="ia-cartao flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-line bg-surface p-6 text-center shadow-2xl">
      <Robo />
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-lg font-bold">{titulo}</h2>
        <p key={i} className="ia-msg m-0 min-h-10 text-sm text-text-2">{passos[i]}...</p>
      </div>
      <ol className="m-0 flex w-full list-none flex-col gap-1.5 p-0 text-left" aria-hidden>
        {passos.map((p, j) => (
          <li key={p} className={`flex items-center gap-2 text-xs transition-colors ${j < i ? "text-ok" : j === i ? "font-bold text-text" : "text-muted"}`}>
            <span className={`grid size-4 shrink-0 place-items-center rounded-full border text-[9px] ${j < i ? "border-ok bg-ok text-accent-ink" : j === i ? "border-accent" : "border-line-2"}`}>
              {j < i ? "✓" : j === i ? <span className="size-1.5 animate-pulse rounded-full bg-accent" /> : ""}
            </span>
            {p}
          </li>
        ))}
      </ol>
      <div className="flex w-full flex-col gap-1">
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div className="ia-barra h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-muted">{t < duracao * 1.6 ? `Costuma levar uns ${Math.round(duracao)} segundos` : "Ainda pensando, já quase lá. Não feche a tela."}</span>
      </div>
    </div>
  );
  return (
    <div role="status" aria-live="polite" aria-label={`${titulo}: ${passos[i]}`} className={modo === "tela" ? "ia-fundo fixed inset-0 z-50 overflow-y-auto bg-bg/80 backdrop-blur-md" : "flex justify-center py-2"}>
      {modo === "tela" ? <div className="flex min-h-full items-center justify-center p-5">{corpo}</div> : corpo}
    </div>
  );
}
