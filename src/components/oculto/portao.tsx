"use client";

import { useMemo, useState } from "react";

/** Céu com estrelas (posições fixas, sem Math.random no render). */
export function CeuEstrelado({ n = 40 }: { n?: number }) {
  const estrelas = useMemo(() => Array.from({ length: n }, (_, i) => ({ l: (i * 37.7) % 100, t: (i * 53.3) % 62, d: (i % 7) * 0.45, s: i % 5 === 0 ? 3 : 2 })), [n]);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {estrelas.map((e, i) => (
        <span key={i} className="oc-estrela" style={{ left: `${e.l}%`, top: `${e.t}%`, animationDelay: `${e.d}s`, width: e.s, height: e.s }} />
      ))}
      <div className="oc-nevoa absolute bottom-[18%] left-0 h-24 w-[160%] blur-2xl" />
    </div>
  );
}

const FAISCAS = Array.from({ length: 28 }, (_, i) => {
  const ang = (i / 28) * Math.PI * 2;
  const r = 120 + (i % 4) * 45;
  return { x: `${Math.round(Math.cos(ang) * r)}px`, y: `${Math.round(Math.sin(ang) * r)}px`, d: `${0.5 + (i % 6) * 0.08}s`, c: i % 3 === 0 ? "var(--c-pink)" : i % 3 === 1 ? "var(--c-amber)" : "#fff" };
});

/**
 * O portão do castelo: a chave gira, as duas folhas abrem em 3D, a luz sai de dentro e explodem faíscas.
 * Depois aparece "Bem-vinda ao País Oculto" e chama onEntrar.
 */
export function PortaoCastelo({ nome, jaAbriu, onAbrir, onEntrar }: { nome: string; jaAbriu: boolean; onAbrir: () => void; onEntrar: () => void }) {
  const [fase, setFase] = useState<"fechado" | "girou" | "aberto" | "dentro">("fechado");
  const abrir = () => {
    if (fase !== "fechado") return;
    onAbrir();
    setFase("girou");
    setTimeout(() => setFase("aberto"), 750);
    setTimeout(() => setFase("dentro"), 2600);
  };
  const cls = fase === "girou" ? "oc-girou" : fase === "aberto" || fase === "dentro" ? "oc-girou oc-aberto" : "";
  return (
    <div className={`oc-ceu relative isolate flex min-h-[calc(100dvh-140px)] flex-col items-center justify-end overflow-hidden rounded-3xl border border-c-amber/30 ${cls}`}>
      <CeuEstrelado />
      {/* lua */}
      <svg aria-hidden className="oc-lua absolute right-[7%] top-[3%]" width="46" height="46" viewBox="0 0 64 64">
        <path d="M40 8a24 24 0 1 0 16 40A20 20 0 0 1 40 8z" fill="#fff4d6" />
      </svg>

      <div className="absolute inset-x-0 top-[9%] z-10 flex flex-col items-center gap-2 px-6 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-c-amber">Só pra convidadas</span>
        <h1 className="oc-titulo m-0 text-[30px] font-extrabold leading-tight sm:text-[38px]">País Oculto</h1>
        <p className={`m-0 max-w-xs text-sm text-text-2 transition-opacity duration-700 ${fase === "fechado" ? "opacity-100" : "opacity-0"}`}>{nome}, atrás desse portão tem mercados que quase ninguém do Brasil enxerga. E a estratégia pra chegar lá.</p>
      </div>

      {/* castelo */}
      <div className="relative z-[1] w-full max-w-[420px] px-4">
        <svg viewBox="0 0 400 300" className="block w-full" aria-hidden>
          <defs>
            <linearGradient id="oc-pedra" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a2f57" />
              <stop offset="1" stopColor="#1a1428" />
            </linearGradient>
          </defs>
          {/* torres */}
          {[30, 310].map((x) => (
            <g key={x}>
              <rect x={x} y="70" width="60" height="230" fill="url(#oc-pedra)" />
              {[0, 1, 2, 3].map((k) => <rect key={k} x={x + k * 16} y="58" width="10" height="14" fill="#2c2342" />)}
              <path d={`M${x + 30} 58 V20`} stroke="#8a7bb0" strokeWidth="2" />
              <path className="oc-bandeira" d={`M${x + 30} 20 h26 l-8 8 l8 8 h-26 z`} fill={x < 100 ? "var(--c-amber)" : "var(--c-pink)"} style={{ transformBox: "fill-box" }} />
              <rect className="oc-janela" x={x + 22} y="120" width="16" height="24" rx="8" fill="var(--c-amber)" opacity="0.85" />
            </g>
          ))}
          {/* muralha */}
          <rect x="90" y="110" width="220" height="190" fill="url(#oc-pedra)" />
          {Array.from({ length: 11 }, (_, k) => <rect key={k} x={90 + k * 20} y="98" width="12" height="14" fill="#2c2342" />)}
          <rect className="oc-janela" x="120" y="140" width="14" height="20" rx="7" fill="var(--c-amber)" opacity="0.7" style={{ animationDelay: "0.8s" }} />
          <rect className="oc-janela" x="266" y="140" width="14" height="20" rx="7" fill="var(--c-amber)" opacity="0.7" style={{ animationDelay: "1.4s" }} />
          {/* vão do portão */}
          <path d="M150 300 V200 a50 50 0 0 1 100 0 V300 z" fill="#05030a" />
        </svg>

        {/* luz de dentro + folhas do portão (HTML pra ter 3D de verdade) */}
        <div className="oc-portao absolute bottom-0 left-1/2 h-[34%] w-[25%] -translate-x-1/2" style={{ borderTopLeftRadius: "999px 60%", borderTopRightRadius: "999px 60%" }}>
          <div className="oc-luz absolute -inset-[140%] rounded-full" style={{ background: "radial-gradient(closest-side, #fff8e1, color-mix(in srgb, var(--c-amber) 80%, transparent) 30%, color-mix(in srgb, var(--c-pink) 35%, transparent) 60%, transparent)" }} />
          <div className="absolute inset-0 overflow-visible" style={{ borderTopLeftRadius: "999px 60%", borderTopRightRadius: "999px 60%" }}>
            <div className="oc-folha oc-folha-e absolute inset-y-0 left-0 w-1/2 rounded-tl-[999px] border-r border-black/40" style={{ background: "repeating-linear-gradient(90deg, #6b4423 0 10px, #5a3a1e 10px 12px)" }}>
              <span className="absolute left-1.5 top-1/2 h-[2px] w-[80%] bg-[#2a1a0e]" />
              <span className="absolute bottom-[22%] left-1.5 h-[2px] w-[80%] bg-[#2a1a0e]" />
            </div>
            <div className="oc-folha oc-folha-d absolute inset-y-0 right-0 w-1/2 rounded-tr-[999px] border-l border-black/40" style={{ background: "repeating-linear-gradient(90deg, #6b4423 0 10px, #5a3a1e 10px 12px)" }}>
              <span className="absolute right-1.5 top-1/2 h-[2px] w-[80%] bg-[#2a1a0e]" />
              <span className="absolute bottom-[22%] right-1.5 h-[2px] w-[80%] bg-[#2a1a0e]" />
            </div>
          </div>
          {/* fechadura e chave */}
          <span className={`oc-fechadura absolute left-1/2 top-[52%] grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#c9a227] transition-opacity duration-500 ${fase === "aberto" || fase === "dentro" ? "opacity-0" : ""}`}>
            <svg className="oc-chave" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2a1a0e" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <circle cx="8" cy="12" r="4" />
              <path d="M12 12h9M18 12v3M21 12v2" />
            </svg>
          </span>
          {FAISCAS.map((f, i) => <span key={i} className="oc-faisca" style={{ ["--x" as string]: f.x, ["--y" as string]: f.y, ["--d" as string]: f.d, background: f.c }} />)}
        </div>
      </div>

      {/* ação */}
      <div className="relative z-10 flex w-full flex-col items-center gap-2 p-5">
        {fase === "dentro" ? (
          <div className="oc-revela flex flex-col items-center gap-3 text-center">
            <span className="oc-titulo text-2xl font-extrabold">Bem-vinda ao País Oculto</span>
            <button type="button" className="b1 w-auto px-8" onClick={onEntrar} autoFocus>Entrar</button>
          </div>
        ) : (
          <>
            <button type="button" onClick={abrir} disabled={fase !== "fechado"} className="press flex min-h-14 w-full max-w-xs items-center justify-center gap-2 rounded-2xl text-[17px] font-extrabold text-[#2a1a0e] shadow-[0_0_30px_color-mix(in_srgb,var(--c-amber)_55%,transparent)]" style={{ background: "linear-gradient(135deg, #ffe08a, var(--c-amber), #ffb86b)" }}>
              {fase === "fechado" ? "Girar a chave e abrir" : "Abrindo..."}
            </button>
            {jaAbriu && fase === "fechado" ? <button type="button" className="b3 text-sm text-text-2" onClick={onEntrar}>Pular a abertura</button> : null}
          </>
        )}
      </div>
    </div>
  );
}
