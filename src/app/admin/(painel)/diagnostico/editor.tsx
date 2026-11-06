"use client";

import { useMemo, useState } from "react";
import { BarraSalvar, Campo } from "@/components/admin/salvar";
import type { Caminho, ConfigDiagnostico, Divulgacao, Pergunta, Puxa } from "@/lib/domain/diagnostico";

const CAMINHOS: [Caminho, string][] = [["afiliada", "Afiliada do SDM"], ["produto", "Produto próprio"], ["ambos", "Os dois"]];
const DIVS: [Divulgacao, string][] = [["pago", "Anúncio pago"], ["org", "Orgânico"], ["ambos", "Os dois"]];

const novaChave = (lista: Pergunta[]) => {
  let n = lista.length + 1;
  while (lista.some((p) => p.k === `p${n}`)) n++;
  return `p${n}`;
};

export function EditorDiagnostico({ inicial }: { inicial: ConfigDiagnostico }) {
  const [cfg, setCfg] = useState<ConfigDiagnostico>(inicial);
  const [base, setBase] = useState(() => JSON.stringify(inicial));
  const [aberta, setAberta] = useState<number | null>(0);
  const sujo = useMemo(() => JSON.stringify(cfg) !== base, [cfg, base]);

  const setP = (i: number, p: Partial<Pergunta>) => setCfg({ ...cfg, perguntas: cfg.perguntas.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const mover = (i: number, d: -1 | 1) => {
    const l = [...cfg.perguntas];
    const j = i + d;
    if (j < 0 || j >= l.length) return;
    [l[i], l[j]] = [l[j]!, l[i]!];
    setCfg({ ...cfg, perguntas: l });
    setAberta(j);
  };
  const setRegra = (i: number, o: string, r: Puxa) => {
    const p = cfg.perguntas[i]!;
    const regras = { ...(p.regras ?? {}) };
    const limpa: Puxa = {};
    if (r.caminho) limpa.caminho = r.caminho;
    if (r.divulgacao) limpa.divulgacao = r.divulgacao;
    if ((limpa.caminho || limpa.divulgacao) && r.peso !== undefined && r.peso !== 1) limpa.peso = r.peso;
    if (limpa.caminho || limpa.divulgacao) regras[o] = limpa;
    else delete regras[o];
    setP(i, { regras });
  };

  // valor salvo: normaliza tipo (multi → multipla) e tira regras de opções que não existem mais
  const valor = () => ({
    ...cfg,
    perguntas: cfg.perguntas.map((p) => {
      const tipo = p.tipo ?? (p.multi ? "multipla" : "unica");
      const regras = Object.fromEntries(Object.entries(p.regras ?? {}).filter(([o]) => p.o.includes(o)));
      const { multi: _m, ...resto } = p;
      void _m;
      return { ...resto, tipo, o: tipo === "texto" ? [] : p.o, regras: tipo === "texto" ? undefined : regras };
    }),
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="acd flex flex-col gap-4 p-5" aria-labelledby="dec">
        <div className="flex flex-col gap-1">
          <h2 id="dec" className="m-0 text-lg font-bold">Como o app decide o caminho</h2>
          <p className="mu m-0 text-sm">Cada opção marcada pode puxar um caminho e uma divulgação, com um peso. O app soma os pesos: ganha o maior. Empate ou nada marcado: vale o padrão.</p>
        </div>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Quem decide">
          {([
            ["regras", "As regras decidem, a IA explica", "O caminho sai sempre das regras abaixo. A IA só escreve o resumo e o porquê. Mais previsível."],
            ["ia", "A IA decide, usando as regras como orientação", "A IA lê todas as respostas e pode sugerir outro caminho se fizer mais sentido."],
          ] as const).map(([v, t, d]) => (
            <button key={v} type="button" role="radio" aria-checked={cfg.decisao.modo === v} onClick={() => setCfg({ ...cfg, decisao: { ...cfg.decisao, modo: v } })} className={`press flex flex-col items-start gap-0.5 rounded-xl border-[1.5px] px-4 py-3 text-left ${cfg.decisao.modo === v ? "border-accent bg-sel" : "border-line bg-surface"}`}>
              <span className="text-sm font-bold">{t}</span>
              <span className="text-xs text-muted">{d}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo id="cp" label="Caminho padrão">
            <select id="cp" className="ain" value={cfg.decisao.caminhoPadrao} onChange={(e) => setCfg({ ...cfg, decisao: { ...cfg.decisao, caminhoPadrao: e.target.value as Caminho } })}>
              {CAMINHOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Campo>
          <Campo id="dp" label="Divulgação padrão">
            <select id="dp" className="ain" value={cfg.decisao.divulgacaoPadrao} onChange={(e) => setCfg({ ...cfg, decisao: { ...cfg.decisao, divulgacaoPadrao: e.target.value as Divulgacao } })}>
              {DIVS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Campo>
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="perg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="perg" className="m-0 text-lg font-bold">Perguntas ({cfg.perguntas.length})</h2>
          <button
            type="button"
            className="ab2"
            onClick={() => {
              const l = [...cfg.perguntas, { k: novaChave(cfg.perguntas), q: "Nova pergunta", p: "", o: ["Opção 1", "Opção 2"], tipo: "unica" as const }];
              setCfg({ ...cfg, perguntas: l });
              setAberta(l.length - 1);
            }}
          >
            + Nova pergunta
          </button>
        </div>
        {cfg.perguntas.map((p, i) => {
          const tipo = p.tipo ?? (p.multi ? "multipla" : "unica");
          const aberto = aberta === i;
          return (
            <div key={i} className={`acd flex flex-col gap-3 p-4 ${aberto ? "border-accent" : ""}`}>
              <div className="flex items-center gap-2">
                <button type="button" className="flex min-h-11 flex-1 items-center gap-3 text-left" aria-expanded={aberto} onClick={() => setAberta(aberto ? null : i)}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sel text-xs font-bold text-accent-2">{i + 1}</span>
                  <span className="flex flex-col">
                    <span className="font-bold">{p.q}</span>
                    <span className="text-xs text-muted">
                      {tipo === "multipla" ? "Várias opções" : tipo === "texto" ? "Texto livre" : "Uma opção"} · {tipo === "texto" ? "—" : `${p.o.length} opções`}
                      {Object.keys(p.regras ?? {}).length ? ` · ${Object.keys(p.regras ?? {}).length} regra(s)` : ""}
                    </span>
                  </span>
                </button>
                <button type="button" className="ab2 px-3" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                <button type="button" className="ab2 px-3" aria-label="Descer" disabled={i === cfg.perguntas.length - 1} onClick={() => mover(i, 1)}>↓</button>
              </div>
              {aberto ? (
                <div className="flex flex-col gap-3 border-t border-line pt-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                    <Campo id={`q-${i}`} label="Pergunta">
                      <input id={`q-${i}`} className="ain" value={p.q} maxLength={200} onChange={(e) => setP(i, { q: e.target.value })} />
                    </Campo>
                    <Campo id={`k-${i}`} label="Código" ajuda="Usado pra guardar a resposta. Evite trocar depois.">
                      <input id={`k-${i}`} className="ain font-mono" value={p.k} maxLength={30} onChange={(e) => setP(i, { k: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} />
                    </Campo>
                  </div>
                  <Campo id={`p-${i}`} label="Por que eu pergunto">
                    <input id={`p-${i}`} className="ain" value={p.p} maxLength={300} onChange={(e) => setP(i, { p: e.target.value })} />
                  </Campo>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo id={`t-${i}`} label="Tipo de resposta">
                      <select id={`t-${i}`} className="ain" value={tipo} onChange={(e) => setP(i, { tipo: e.target.value as Pergunta["tipo"], multi: undefined })}>
                        <option value="unica">Uma opção</option>
                        <option value="multipla">Várias opções</option>
                        <option value="texto">Texto livre</option>
                      </select>
                    </Campo>
                    {tipo !== "texto" ? (
                      <label className="flex min-h-11 items-center gap-2 self-end text-sm">
                        <input type="checkbox" className="size-5 accent-[var(--accent)]" checked={Boolean(p.outro)} onChange={(e) => setP(i, { outro: e.target.checked })} />
                        Mostrar &quot;Outro&quot; com campo pra escrever
                      </label>
                    ) : null}
                  </div>
                  {tipo !== "texto" ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-bold">Opções e o que cada uma puxa</span>
                      {p.o.map((o, j) => {
                        const r = p.regras?.[o] ?? {};
                        return (
                          <div key={j} className="grid items-center gap-2 rounded-xl border border-line bg-surface-2 p-2 sm:grid-cols-[1fr_150px_140px_70px_44px]">
                            <input
                              aria-label={`Opção ${j + 1}`}
                              className="ain"
                              value={o}
                              maxLength={120}
                              onChange={(e) => {
                                const novo = e.target.value;
                                const regras = { ...(p.regras ?? {}) };
                                if (regras[o]) {
                                  regras[novo] = regras[o]!;
                                  delete regras[o];
                                }
                                setP(i, { o: p.o.map((x, k) => (k === j ? novo : x)), regras });
                              }}
                            />
                            <select aria-label="Caminho que puxa" className="ain" value={r.caminho ?? ""} onChange={(e) => setRegra(i, o, { ...r, caminho: (e.target.value || undefined) as Caminho | undefined })}>
                              <option value="">Caminho: —</option>
                              {CAMINHOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                            </select>
                            <select aria-label="Divulgação que puxa" className="ain" value={r.divulgacao ?? ""} onChange={(e) => setRegra(i, o, { ...r, divulgacao: (e.target.value || undefined) as Divulgacao | undefined })}>
                              <option value="">Divulgação: —</option>
                              {DIVS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                            </select>
                            <input aria-label="Peso" title="Peso" type="number" min={0} max={10} step={1} className="ain" value={r.peso ?? 1} disabled={!r.caminho && !r.divulgacao} onChange={(e) => setRegra(i, o, { ...r, peso: Number(e.target.value) })} />
                            <button type="button" className="ab2 px-0" aria-label={`Apagar a opção ${o}`} onClick={() => setP(i, { o: p.o.filter((_, k) => k !== j) })}>×</button>
                          </div>
                        );
                      })}
                      <button type="button" className="ab2 self-start" onClick={() => setP(i, { o: [...p.o, `Opção ${p.o.length + 1}`] })}>+ Opção</button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="self-start text-sm font-bold text-danger"
                    onClick={() => {
                      if (cfg.perguntas.length > 1 && confirm(`Apagar a pergunta "${p.q}"?`)) {
                        setCfg({ ...cfg, perguntas: cfg.perguntas.filter((_, k) => k !== i) });
                        setAberta(null);
                      }
                    }}
                  >
                    Apagar pergunta
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <BarraSalvar k="diagnostico" valor={valor} sujo={sujo} onSalvo={() => setBase(JSON.stringify(cfg))} />
    </div>
  );
}
