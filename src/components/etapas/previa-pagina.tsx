"use client";

import { useState } from "react";
import { CopyButton } from "@/components/pasta/copy-button";

type Bloco = { n: string; oq: string; x: string; pt: string };

/** Prévia da página de vendas montada como página de verdade (celular ou computador, idioma ou português). */
export function PreviaPagina({ blocos, titulo }: { blocos: Bloco[]; titulo: string }) {
  const [pt, setPt] = useState(false);
  const [web, setWeb] = useState(false);
  const txt = (b: Bloco) => (pt ? b.pt : b.x);
  const tudo = blocos.map((b) => `${b.n.toUpperCase()}\n${txt(b)}`).join("\n\n");
  const [topo, ...meio] = blocos;
  const fim = meio.length > 1 ? meio.pop() : undefined;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-line p-1" role="group" aria-label="Idioma">
          {[["Idioma de venda", false], ["Português", true]].map(([t, v]) => (
            <button key={String(t)} type="button" aria-pressed={pt === v} onClick={() => setPt(v as boolean)} className={`min-h-9 rounded-full px-3 text-xs font-bold ${pt === v ? "bg-accent text-accent-ink" : "text-muted"}`}>{t as string}</button>
          ))}
        </div>
        <div className="flex rounded-full border border-line p-1" role="group" aria-label="Tela">
          {[["Celular", false], ["Computador", true]].map(([t, v]) => (
            <button key={String(t)} type="button" aria-pressed={web === v} onClick={() => setWeb(v as boolean)} className={`min-h-9 rounded-full px-3 text-xs font-bold ${web === v ? "bg-accent text-accent-ink" : "text-muted"}`}>{t as string}</button>
          ))}
        </div>
        <CopyButton text={tudo} label="Copiar a página inteira" />
      </div>
      <div className={`mx-auto w-full overflow-hidden border-line-2 bg-white text-[#1d1b22] shadow-2xl transition-all ${web ? "max-w-3xl rounded-xl border" : "max-w-[360px] rounded-[30px] border-[8px] border-[#22202a]"}`}>
        {web ? <div className="flex gap-1.5 bg-[#ece9f1] px-3 py-2" aria-hidden>{["#ff6b6b", "#ffc861", "#5ee0cf"].map((c) => <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />)}</div> : null}
        <div className={`max-h-[640px] overflow-y-auto ${web ? "px-10 py-8" : "px-5 py-6"}`}>
          {topo ? (
            <header className="mb-6 text-center">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#7c5ce0]">{titulo}</p>
              <h3 className={`m-0 font-extrabold leading-tight ${web ? "text-3xl" : "text-2xl"}`}>{txt(topo)}</h3>
            </header>
          ) : null}
          {meio.map((b, i) => (
            <section key={i} className={`mb-5 ${i % 3 === 1 ? "rounded-xl bg-[#f4f0ff] p-4" : ""}`}>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[1.5px] text-[#7c5ce0]">{b.n}</p>
              <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed">{txt(b)}</p>
            </section>
          ))}
          {fim ? (
            <div className="mt-6 rounded-2xl bg-[#2a2240] p-5 text-center text-white">
              <p className="m-0 mb-3 whitespace-pre-line text-[15px] leading-relaxed">{txt(fim)}</p>
              <span className="inline-block rounded-xl bg-[#a98bff] px-5 py-3 text-sm font-extrabold text-[#140f1f]">{pt ? "Quero o meu" : "Get it now"}</span>
            </div>
          ) : null}
        </div>
      </div>
      <p className="mu m-0 text-center text-xs">Prévia de como fica. Pra publicar, copie os blocos pra ferramenta de página.</p>
    </div>
  );
}
