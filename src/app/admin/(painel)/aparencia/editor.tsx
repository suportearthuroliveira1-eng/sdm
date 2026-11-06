"use client";

import { useMemo, useState } from "react";
import { BarraSalvar, Interruptor } from "@/components/admin/salvar";
import { Icone } from "@/components/ui/icone";
import { Robo } from "@/components/ux/ia-trabalhando";
import { contraste, PRESETS, type Tema } from "@/lib/domain/tema";

const CORES: [keyof Tema, string, string][] = [
  ["accent", "Destaque", "Botões principais, seleção, barra de progresso."],
  ["accent2", "Destaque claro", "Links e textos de destaque."],
  ["bg", "Fundo", "Fundo de todas as telas."],
  ["surface", "Cartões", "Cartões e caixas."],
  ["teal", "Apoio 1 (ficha, IA)", ""],
  ["amber", "Apoio 2 (ideias, A IA faz tudo)", ""],
  ["pink", "Apoio 3 (oferta, divulgação)", ""],
  ["sky", "Apoio 4 (idioma e país)", ""],
  ["orange", "Apoio 5 (revisão)", ""],
];
const TEXTO = "#f4f1f8";
const TINTA = "#140f1f";

function vars(t: Tema): React.CSSProperties {
  return {
    ["--accent" as string]: t.accent,
    ["--accent-2" as string]: t.accent2,
    ["--bg" as string]: t.bg,
    ["--surface" as string]: t.surface,
    ["--surface-2" as string]: `color-mix(in srgb, ${t.surface} 88%, #fff 6%)`,
    ["--sel" as string]: `color-mix(in srgb, ${t.accent} 22%, ${t.bg})`,
    ["--line" as string]: `color-mix(in srgb, ${t.surface} 78%, #fff 12%)`,
    ["--line-2" as string]: `color-mix(in srgb, ${t.surface} 70%, #fff 18%)`,
    ["--c-teal" as string]: t.teal,
    ["--c-amber" as string]: t.amber,
    ["--c-pink" as string]: t.pink,
    ["--c-sky" as string]: t.sky,
    ["--c-orange" as string]: t.orange,
    ["--raio" as string]: `${t.raio}px`,
    background: t.bg,
  };
}

export function EditorTema({ inicial }: { inicial: Tema }) {
  const [t, setT] = useState<Tema>(inicial);
  const [base, setBase] = useState(() => JSON.stringify(inicial));
  const sujo = useMemo(() => JSON.stringify(t) !== base, [t, base]);
  const avisos = [
    contraste(TEXTO, t.bg) < 4.5 ? "O texto fica difícil de ler nesse fundo (contraste abaixo de AA). Use um fundo mais escuro." : "",
    contraste(TINTA, t.accent) < 4.5 ? "O texto dos botões principais fica difícil de ler. Use um destaque mais claro." : "",
    contraste(t.accent2, t.bg) < 4.5 ? "Os links ficam difíceis de ler. Use um destaque claro mais claro." : "",
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2" aria-labelledby="pre">
        <h2 id="pre" className="m-0 text-lg font-bold">Temas prontos</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {PRESETS.map((p) => (
            <button key={p.k} type="button" aria-pressed={t.preset === p.k} onClick={() => setT({ ...t, ...p.t, preset: p.k })} className={`press flex flex-col gap-2 rounded-2xl border-[1.5px] p-3 text-left ${t.preset === p.k ? "border-accent bg-sel" : "border-line bg-surface"}`}>
              <span className="flex gap-1">
                {[p.t.accent, p.t.teal, p.t.amber, p.t.pink, p.t.bg].map((c) => (
                  <span key={c} className="size-5 rounded-full border border-white/10" style={{ background: c }} />
                ))}
              </span>
              <span className="text-sm font-bold">{p.nome}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="acd gap-3" aria-labelledby="cores">
          <h2 id="cores" className="m-0 text-lg font-bold">Cores</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CORES.map(([k, l, d]) => (
              <div key={k} className="flex items-center gap-3">
                <input type="color" aria-label={l} value={t[k] as string} onChange={(e) => setT({ ...t, [k]: e.target.value, preset: undefined })} className="size-11 shrink-0 cursor-pointer rounded-xl border border-line-2 bg-transparent p-1" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold">{l}</span>
                  <input aria-label={`${l} (código)`} value={t[k] as string} maxLength={7} onChange={(e) => setT({ ...t, [k]: e.target.value, preset: undefined })} className="w-24 bg-transparent font-mono text-xs text-muted focus:text-text focus:outline-none" />
                  {d ? <span className="text-[11px] text-muted">{d}</span> : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <label htmlFor="raio" className="text-sm font-bold">Cantos arredondados: {t.raio}px</label>
            <input id="raio" type="range" min={6} max={28} value={t.raio} onChange={(e) => setT({ ...t, raio: Number(e.target.value) })} className="accent-[var(--accent)]" />
          </div>
          <Interruptor id="anim" label="Animações" ajuda="Robô da IA, telas que surgem, linhas do fluxograma. Quem pediu 'reduzir movimento' no celular não vê animação de qualquer jeito." on={t.animacoes} onChange={(v) => setT({ ...t, animacoes: v })} />
          {avisos.map((a) => <div key={a} className="warn">{a}</div>)}
        </section>

        <section aria-label="Prévia" className="flex flex-col gap-2">
          <span className="kk">PRÉVIA</span>
          <div style={vars(t)} className="flex flex-col gap-3 overflow-hidden rounded-[28px] border border-line p-4 text-text">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl" style={{ color: t.teal, background: `color-mix(in srgb, ${t.teal} 16%, transparent)` }}><Icone nome="ficha" tamanho={22} /></span>
              <span className="text-lg font-bold">Ficha do produto</span>
            </div>
            <div className="flex gap-1">
              {["#8fe3b8", t.accent, t.teal, "", ""].map((c, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: c || `color-mix(in srgb, ${t.surface} 78%, #fff 12%)` }} />)}
            </div>
            <div className="cd">
              <span className="kk">SEU PRÓXIMO PASSO</span>
              <span className="tx">Responda 3 perguntas e a IA completa a ficha.</span>
              <a className="text-sm font-semibold" style={{ color: t.accent2 }}>Ver a aula antes</a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[["Ideias", t.amber], ["Oferta", t.pink], ["País", t.sky], ["Revisão", t.orange]].map(([n, c]) => (
                <span key={n} className="rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ color: c, borderColor: `color-mix(in srgb, ${c} 50%, transparent)` }}>{n}</span>
              ))}
            </div>
            <div className="flex items-center gap-2"><Robo tamanho={56} /><span className="text-sm text-text-2">A IA está montando a sua ficha...</span></div>
            <button type="button" className="b1">Gerar a ficha com a IA</button>
            <button type="button" className="b2">Voltar</button>
          </div>
        </section>
      </div>

      <BarraSalvar k="tema" valor={() => ({ ...t, preset: t.preset })} sujo={sujo} onSalvo={() => { setBase(JSON.stringify(t)); window.location.reload(); }} />
    </div>
  );
}
