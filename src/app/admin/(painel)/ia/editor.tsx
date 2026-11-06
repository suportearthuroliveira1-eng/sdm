"use client";

import { useMemo, useState, useTransition } from "react";
import { BarraSalvar, Campo, Interruptor } from "@/components/admin/salvar";
import { Spinner } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { ativarVersaoAgente, salvarConfig, salvarPromptAgente, type ConfigState } from "@/lib/actions/admin-config";
import type { ConfigIa } from "@/lib/ai/run";

type Uso = { n: number; custo: number; cache: number };
export type AgenteView = {
  k: string;
  nome: string;
  classe: "text_cheap" | "text_mid";
  maxTokens: number;
  padrao: string;
  atual: string;
  versaoAtiva: number | null;
  versoes: { versao: number; em: string; ativo: boolean }[];
  uso: Uso;
};

const CLASSES = [
  ["text_cheap", "Rápido e barato"],
  ["text_mid", "Mais caprichado"],
] as const;

const usoTxt = (u: Uso) => (u.n ? `${u.n} uso(s) em 7 dias · ${u.cache} do cache · US$ ${Number(u.custo).toFixed(3)}` : "Sem uso nos últimos 7 dias");

function PromptAgente({ a }: { a: AgenteView }) {
  const [txt, setTxt] = useState(a.atual);
  const [salvo, setSalvo] = useState(a.atual);
  const [pend, start] = useTransition();
  const [st, setSt] = useState<ConfigState>(null);
  const rodar = (f: () => Promise<ConfigState>, depois?: () => void) =>
    start(async () => {
      const r: ConfigState = await f().catch(() => ({ erro: "Sem conexão." }));
      setSt(r);
      if (r?.ok) {
        toast(r.msg ?? "Salvo");
        depois?.();
      }
    });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`pr-${a.k}`} className="text-sm font-bold">
          O que esse agente faz (prompt) {a.versaoAtiva ? <span className="font-normal text-muted">· versão {a.versaoAtiva}</span> : <span className="font-normal text-muted">· padrão do app</span>}
        </label>
        {a.versoes.length ? (
          <select
            aria-label="Voltar pra uma versão"
            className="ain w-auto"
            value=""
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v) rodar(() => ativarVersaoAgente(a.k, v), () => window.location.reload());
            }}
          >
            <option value="">Versões anteriores…</option>
            {a.versoes.map((v) => (
              <option key={v.versao} value={v.versao} disabled={v.ativo}>
                Versão {v.versao} · {new Date(v.em).toLocaleDateString("pt-BR")} {v.ativo ? "(ativa)" : ""}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <textarea id={`pr-${a.k}`} className="ain min-h-48 py-2 font-mono text-[13px] leading-relaxed" value={txt} onChange={(e) => setTxt(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="ab1" disabled={pend || txt === salvo} onClick={() => rodar(() => salvarPromptAgente(a.k, txt), () => setSalvo(txt))}>
          {pend ? <><Spinner /> Salvando...</> : "Salvar como nova versão"}
        </button>
        <button
          type="button"
          className="ab2"
          disabled={pend || (txt === a.padrao && a.versaoAtiva === null)}
          onClick={() => {
            if (confirm("Voltar pro texto padrão do app?")) rodar(() => salvarPromptAgente(a.k, ""), () => { setTxt(a.padrao); setSalvo(a.padrao); });
          }}
        >
          Usar o padrão
        </button>
        <span role="status" className="text-sm">{st?.erro ? <span className="text-danger">{st.erro}</span> : txt !== salvo ? <span className="text-warn">Não salvo</span> : null}</span>
      </div>
      <p className="m-0 text-xs text-muted">As regras base (acima) entram antes deste texto. O formato da resposta é fixo no app, pra tela saber mostrar.</p>
    </div>
  );
}

export function EditorIa({ cfg, modelos, quotas, regrasPadrao, professoraPadrao, agentes, usoProfessora }: { cfg: ConfigIa; modelos: { text_cheap: string; text_mid: string; image: string; embedding: string }; quotas: { ia: number; prof: number }; regrasPadrao: string; professoraPadrao: string; agentes: AgenteView[]; usoProfessora: Uso }) {
  const ini = { cfg, modelos, quotas };
  const [c, setC] = useState<ConfigIa>(cfg);
  const [m, setM] = useState(modelos);
  const [q, setQ] = useState(quotas);
  const [regras, setRegras] = useState(cfg.regrasBase?.trim() ? cfg.regrasBase : regrasPadrao);
  const [prof, setProf] = useState(cfg.professora?.trim() ? cfg.professora : professoraPadrao);
  const [aberto, setAberto] = useState<string | null>(null);
  const [base, setBase] = useState(() => JSON.stringify(ini));
  const atual = () => ({ ...c, regrasBase: regras.trim() === regrasPadrao.trim() ? undefined : regras, professora: prof.trim() === professoraPadrao.trim() ? undefined : prof });
  const sujo = useMemo(() => JSON.stringify({ cfg: atual(), modelos: m, quotas: q }) !== base, [c, m, q, regras, prof, base]); // eslint-disable-line react-hooks/exhaustive-deps

  const ligado = (k: string) => !c.desligados?.includes(k);
  const setLigado = (k: string, v: boolean) => setC({ ...c, desligados: v ? (c.desligados ?? []).filter((x) => x !== k) : [...(c.desligados ?? []), k] });
  const ajuste = (k: string) => c.agentes?.[k] ?? {};
  const setAjuste = (k: string, p: { classe?: "text_cheap" | "text_mid"; maxTokens?: number }) => setC({ ...c, agentes: { ...(c.agentes ?? {}), [k]: { ...ajuste(k), ...p } } });

  return (
    <div className="flex flex-col gap-6">
      <section className="acd flex flex-col gap-4 p-5" aria-labelledby="ia-mod">
        <h2 id="ia-mod" className="m-0 text-lg font-bold">Modelos e limites</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo id="m-c" label="Rápido e barato" ajuda="Diagnóstico, ideias, ficha, anúncios, Professora.">
            <input id="m-c" className="ain font-mono" value={m.text_cheap} onChange={(e) => setM({ ...m, text_cheap: e.target.value.trim() })} />
          </Campo>
          <Campo id="m-m" label="Mais caprichado" ajuda="Oferta, ebook, página de vendas.">
            <input id="m-m" className="ain font-mono" value={m.text_mid} onChange={(e) => setM({ ...m, text_mid: e.target.value.trim() })} />
          </Campo>
          <Campo id="m-i" label="Imagem" ajuda="Imagem dos criativos.">
            <input id="m-i" className="ain font-mono" value={m.image} onChange={(e) => setM({ ...m, image: e.target.value.trim() })} />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo id="q-ia" label="Usos de IA por aluna por dia">
            <input id="q-ia" type="number" min={1} max={5000} className="ain" value={q.ia} onChange={(e) => setQ({ ...q, ia: Number(e.target.value) })} />
          </Campo>
          <Campo id="q-pr" label="Perguntas à Professora por aluna por dia">
            <input id="q-pr" type="number" min={1} max={1000} className="ain" value={q.prof} onChange={(e) => setQ({ ...q, prof: Number(e.target.value) })} />
          </Campo>
        </div>
      </section>

      <section className="acd flex flex-col gap-3 p-5" aria-labelledby="ia-reg">
        <div className="flex flex-col gap-1">
          <h2 id="ia-reg" className="m-0 text-lg font-bold">Regras base</h2>
          <p className="mu m-0 text-sm">Valem pra toda IA do app: jeito de falar, o que nunca fazer, idioma, tradução. Mudar aqui muda tudo.</p>
        </div>
        <textarea aria-labelledby="ia-reg" className="ain min-h-72 py-2 font-mono text-[13px] leading-relaxed" value={regras} onChange={(e) => setRegras(e.target.value)} />
        {regras.trim() !== regrasPadrao.trim() ? <button type="button" className="ab2 self-start" onClick={() => setRegras(regrasPadrao)}>Voltar ao texto padrão</button> : null}
      </section>

      <section className="acd flex flex-col gap-3 p-5" aria-labelledby="ia-prof">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="ia-prof" className="m-0 text-lg font-bold">Professora</h2>
            <p className="mu m-0 text-xs">{usoTxt(usoProfessora)}</p>
          </div>
          <div className="w-60">
            <Interruptor id="lig-prof" label="Ligada" on={ligado("professora")} onChange={(v) => setLigado("professora", v)} />
          </div>
        </div>
        <Campo id="prof-cl" label="Modelo">
          <select id="prof-cl" className="ain max-w-60" value={ajuste("professora").classe ?? "text_cheap"} onChange={(e) => setAjuste("professora", { classe: e.target.value as "text_cheap" })}>
            {CLASSES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </Campo>
        <Campo id="prof-tx" label="Jeito da Professora" ajuda="O glossário e a lista de aulas entram sozinhos depois deste texto.">
          <textarea id="prof-tx" className="ain min-h-40 py-2 font-mono text-[13px] leading-relaxed" value={prof} onChange={(e) => setProf(e.target.value)} />
        </Campo>
      </section>

      <BarraSalvar
        k="ia"
        sujo={sujo}
        valor={atual}
        podeRestaurar={false}
        salvar={async () => {
          const passos: [Parameters<typeof salvarConfig>[0], unknown][] = [["ia", atual()], ["ai_models", m], ["quota_ia_dia", q.ia], ["quota_professora_dia", q.prof]];
          for (const [k, v] of passos) {
            const r = await salvarConfig(k, v);
            if (!r?.ok) return r;
          }
          return { ok: true, msg: "IA atualizada." };
        }}
        onSalvo={() => setBase(JSON.stringify({ cfg: atual(), modelos: m, quotas: q }))}
      />

      <section className="flex flex-col gap-3" aria-labelledby="ia-ag">
        <div className="flex flex-col gap-1">
          <h2 id="ia-ag" className="m-0 text-lg font-bold">Agentes ({agentes.length})</h2>
          <p className="mu m-0 text-sm">Cada agente faz uma parte do caminho. Desligado: a aluna vê um aviso e o app usa o modelo pronto quando existe. Ligar, modelo e limite salvam na barra acima; o prompt salva no próprio cartão.</p>
        </div>
        {agentes.map((a) => {
          const ab = aberto === a.k;
          return (
            <div key={a.k} className={`acd flex flex-col gap-3 p-4 ${ab ? "border-accent" : ""}`}>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="flex min-h-11 flex-1 flex-col items-start text-left" aria-expanded={ab} onClick={() => setAberto(ab ? null : a.k)}>
                  <span className="font-bold">{a.nome} {a.versaoAtiva ? <span className="ml-1 rounded-md bg-sel px-1.5 py-0.5 text-[11px] text-accent-2">editado v{a.versaoAtiva}</span> : null}</span>
                  <span className="text-xs text-muted">{usoTxt(a.uso)}</span>
                </button>
                <select aria-label={`Modelo do agente ${a.nome}`} className="ain w-auto" value={ajuste(a.k).classe ?? a.classe} onChange={(e) => setAjuste(a.k, { classe: e.target.value as "text_cheap" })}>
                  {CLASSES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
                <div className="w-36">
                  <Interruptor id={`lig-${a.k}`} label={ligado(a.k) ? "Ligado" : "Desligado"} on={ligado(a.k)} onChange={(v) => setLigado(a.k, v)} />
                </div>
              </div>
              {ab ? (
                <div className="flex flex-col gap-3 border-t border-line pt-3">
                  <Campo id={`mt-${a.k}`} label="Tamanho máximo da resposta (tokens)" ajuda={`Padrão: ${a.maxTokens}. Maior = respostas mais longas e mais caras.`}>
                    <input id={`mt-${a.k}`} type="number" min={200} max={16000} step={100} className="ain max-w-40" value={ajuste(a.k).maxTokens ?? a.maxTokens} onChange={(e) => setAjuste(a.k, { maxTokens: Number(e.target.value) })} />
                  </Campo>
                  <PromptAgente a={a} />
                </div>
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
