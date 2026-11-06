"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Icone, type NomeIcone } from "@/components/ui/icone";
import { Robo } from "@/components/ux/ia-trabalhando";

/** Animação automática só quando a pessoa (e o tema do admin) deixam. */
const semInscricao = () => () => {};
function useAutoPlay() {
  return useSyncExternalStore(
    semInscricao,
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches && document.documentElement.dataset.animacoes !== "off",
    () => false,
  );
}

function useCiclo(total: number, ms: number, ligado: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!ligado || total < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % total), ms);
    return () => clearInterval(t);
  }, [total, ms, ligado]);
  return [i, setI] as const;
}

/** Robô com um balão que mostra o que a IA pensa, uma frase por vez, lendo os dados dela. */
export function PensamentoIa({ dados, pensamentos }: { dados: { rotulo: string; valor: string }[]; pensamentos: string[] }) {
  const auto = useAutoPlay();
  const [i] = useCiclo(pensamentos.length, 3600, auto);
  const [lendo] = useCiclo(Math.max(dados.length, 1), 1200, auto);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div className="shrink-0"><Robo tamanho={84} /></div>
        <div className="relative mb-4 flex-1 rounded-2xl rounded-bl-sm border border-c-teal/40 bg-[color-mix(in_srgb,var(--c-teal)_10%,var(--surface))] p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-c-teal">A IA pensa</span>
          <p key={i} className="ia-msg m-0 min-h-[2.8em] text-[14px] font-semibold leading-snug text-text">{pensamentos[i]}</p>
          <span className="mt-1.5 flex gap-1" aria-hidden>
            {pensamentos.map((_, k) => <span key={k} className={`h-1 rounded-full transition-all duration-500 ${k === i ? "w-5 bg-c-teal" : "w-1.5 bg-line-2"}`} />)}
          </span>
        </div>
      </div>
      {dados.length ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-muted">Ela lê o que você contou no diagnóstico:</span>
          <div className="flex flex-wrap gap-1.5">
            {dados.map((d, k) => (
              <span key={d.rotulo} className={`surge rounded-full border px-2.5 py-1 text-xs transition-all duration-500 ${auto && k === lendo ? "scale-105 border-c-teal bg-c-teal/15" : "border-line bg-surface-2"}`} style={{ animationDelay: `${k * 70}ms` }}>
                <span className="text-muted">{d.rotulo}:</span> <b className="text-text">{d.valor}</b>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Fase = { k: string; nome: string; frase: string; minutos: string; cor: string; icone: NomeIcone; passos: { nome: string; cor: string; icone: NomeIcone }[] };

/** O caminho em 4 fases: uma trilha que se acende sozinha, fase por fase. Toque numa fase pra parar nela. */
export function CaminhoFases({ fases }: { fases: Fase[] }) {
  const auto = useAutoPlay();
  const [parou, setParou] = useState(false);
  const [i, setI] = useCiclo(fases.length, 3200, auto && !parou);
  const f = fases[i]!;
  const pct = fases.length > 1 ? (i / (fases.length - 1)) * 100 : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative px-5 pt-1">
        <div className="absolute left-[calc(1.25rem+22px)] right-[calc(1.25rem+22px)] top-[23px] h-1 rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${fases.map((x) => x.cor).join(", ")})` }} />
        </div>
        <ol className="relative m-0 flex list-none justify-between p-0" aria-label="As 4 fases do seu produto">
          {fases.map((x, k) => {
            const ativo = k === i;
            const passou = k < i;
            return (
              <li key={x.k} className="flex w-11 flex-col items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed={ativo}
                  aria-label={`Fase ${k + 1}: ${x.nome}`}
                  onClick={() => { setParou(true); setI(k); }}
                  className={`grid size-11 place-items-center rounded-2xl border-2 transition-all duration-500 ${ativo ? "pulsa scale-110" : ""}`}
                  style={{ ["--cor" as string]: x.cor, color: ativo || passou ? "var(--accent-ink)" : x.cor, background: ativo || passou ? x.cor : "var(--surface)", borderColor: x.cor }}
                >
                  {passou ? <Icone nome="check" tamanho={18} espessura={3} /> : <Icone nome={x.icone} tamanho={20} />}
                </button>
                <span className={`whitespace-nowrap text-[11px] font-bold transition-colors ${ativo ? "text-text" : "text-muted"}`}>{x.nome}</span>
              </li>
            );
          })}
        </ol>
      </div>
      <div key={f.k} className="surge flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-4" style={{ borderColor: `color-mix(in srgb, ${f.cor} 55%, transparent)`, background: `color-mix(in srgb, ${f.cor} 8%, var(--surface))` }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: f.cor }}>Fase {i + 1} de {fases.length} · {f.nome}</span>
          <span className="rounded-full bg-bg/60 px-2 py-0.5 text-[11px] font-bold text-text-2">{f.minutos}</span>
        </div>
        <p className="m-0 text-[15px] font-semibold leading-snug text-text">{f.frase}</p>
        <div className="flex flex-wrap gap-1.5">
          {f.passos.map((s, k) => (
            <span key={s.nome} className="surge flex items-center gap-1.5 rounded-full bg-bg/60 px-2.5 py-1 text-xs font-semibold" style={{ color: s.cor, animationDelay: `${120 + k * 90}ms` }}>
              <Icone nome={s.icone} tamanho={13} /> <span className="text-text">{s.nome}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
