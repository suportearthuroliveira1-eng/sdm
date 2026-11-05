"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Spinner, SubmitButton } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { escolherTema, gerarCapitulo, gerarSumario, salvarSumario } from "@/lib/actions/ebook";
import { TEMAS, TONS, type CapEbook, type TemaKey } from "@/lib/domain/temas";

type Eb = { capitulos: CapEbook[]; aprovado: boolean; tema: string; tom: string; tamanho: number; titulo: string; subtitulo: string; idioma: string } | null;

export function Ebook({ pastaId, eb, proxima }: { pastaId: string; eb: Eb; proxima: string }) {
  if (!eb) return <Opcoes pastaId={pastaId} />;
  if (!eb.aprovado) return <Sumario pastaId={pastaId} eb={eb} />;
  return <Capitulos pastaId={pastaId} eb={eb} proxima={proxima} />;
}

function Opcoes({ pastaId, refazer }: { pastaId: string; refazer?: boolean }) {
  const router = useRouter();
  const [st, action] = useActionState(async (p: { ok?: boolean; erro?: string } | null, f: FormData) => {
    const r = await gerarSumario(pastaId, p, f);
    if (r.ok) {
      toast("Sumário pronto");
      router.refresh();
    }
    return r;
  }, null);
  return (
    <form action={action} className="cd gap-3">
      <span className="kk">PARTE 1 · SUMÁRIO {refazer ? "(REFAZER)" : ""}</span>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eb-caps" className="lb">Capítulos</label>
          <select id="eb-caps" name="capitulos" defaultValue="6" className="in">{[4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n}>{n}</option>)}</select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eb-tam" className="lb">Tamanho</label>
          <select id="eb-tam" name="tamanho" defaultValue="10" className="in"><option value="5">Curto (5 páginas)</option><option value="10">Médio (10 páginas)</option></select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eb-tom" className="lb">Tom</label>
          <select id="eb-tom" name="tom" defaultValue="amiga" className="in">{TONS.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
      </div>
      <span className="mu">O idioma vem do país de venda da pasta.</span>
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="A IA está montando o sumário...">Criar o sumário com a IA</SubmitButton>
    </form>
  );
}

function Sumario({ pastaId, eb }: { pastaId: string; eb: NonNullable<Eb> }) {
  const router = useRouter();
  const [caps, setCaps] = useState(eb.capitulos.map((c) => ({ titulo: c.titulo.x, pt: c.titulo.pt, objetivo: c.objetivo })));
  const [pending, start] = useTransition();
  const [erro, setErro] = useState("");
  const mover = (i: number, d: number) => {
    const n = [...caps];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x!);
    setCaps(n);
  };
  const salvar = (aprovar: boolean) =>
    start(async () => {
      const r = await salvarSumario(pastaId, caps.map(({ titulo, objetivo }) => ({ titulo, objetivo })), aprovar);
      if (r.erro) setErro(r.erro);
      else {
        toast(aprovar ? "Sumário aprovado" : "Sumário salvo");
        router.refresh();
      }
    });
  return (
    <div className="flex flex-col gap-3">
      <div className="cd gap-1"><span className="kk">SEU EBOOK</span><span className="text-lg font-bold">{eb.titulo}</span><span className="mu">{eb.subtitulo}</span></div>
      <span className="kk">PARTE 1 · SUMÁRIO · APROVAR, EDITAR, MUDAR A ORDEM</span>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {caps.map((c, i) => (
          <li key={i} className="cd gap-1.5 border border-line">
            <div className="flex items-center gap-2">
              <span className="dot bg-sel text-accent-2" aria-hidden>{i + 1}</span>
              <label className="sr-only" htmlFor={`cap-${i}`}>Título do capítulo {i + 1}</label>
              <input id={`cap-${i}`} value={c.titulo} onChange={(e) => setCaps(caps.map((x, k) => (k === i ? { ...x, titulo: e.target.value } : x)))} className="in flex-1" />
            </div>
            <span className="mu">{c.pt !== c.titulo ? `${c.pt} · ` : ""}{c.objetivo}</span>
            <div className="flex gap-1">
              <button type="button" className="b3 min-h-9 px-2 text-xs" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑ Subir</button>
              <button type="button" className="b3 min-h-9 px-2 text-xs" disabled={i === caps.length - 1} onClick={() => mover(i, 1)} aria-label="Descer">↓ Descer</button>
              <button type="button" className="b3 min-h-9 px-2 text-xs text-danger" disabled={caps.length <= 4} onClick={() => setCaps(caps.filter((_, k) => k !== i))}>Tirar</button>
            </div>
          </li>
        ))}
      </ol>
      {caps.length < 10 ? <button type="button" className="b2" onClick={() => setCaps([...caps, { titulo: "Novo capítulo", pt: "", objetivo: "" }])}>+ Adicionar capítulo</button> : null}
      {erro ? <span role="alert" className="text-sm text-danger">{erro}</span> : null}
      <button type="button" className="b1" disabled={pending} onClick={() => salvar(true)}>{pending ? <Spinner /> : null} Aprovar o sumário</button>
      <details className="rounded-[14px] border border-line p-3"><summary className="cursor-pointer font-semibold">Gerar outro sumário</summary><div className="mt-3"><Opcoes pastaId={pastaId} refazer /></div></details>
    </div>
  );
}

function Capitulos({ pastaId, eb, proxima }: { pastaId: string; eb: NonNullable<Eb>; proxima: string }) {
  const router = useRouter();
  const [rodando, setRodando] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState<number | null>(null);
  const [pt, setPt] = useState(false);
  const [, start] = useTransition();
  const feitos = eb.capitulos.filter((c) => c.texto).length;
  const pct = Math.round((feitos / eb.capitulos.length) * 100);

  const gerarTodos = async () => {
    setErro("");
    for (let i = 0; i < eb.capitulos.length; i++) {
      if (eb.capitulos[i]!.texto) continue;
      setRodando(i);
      const r = await gerarCapitulo(pastaId, i, null);
      if (r.erro) {
        setErro(`Capítulo ${i + 1}: ${r.erro} Toque em "Continuar" pra refazer só ele.`);
        break;
      }
      router.refresh();
    }
    setRodando(null);
    router.refresh();
  };
  const ajustar = (i: number, aj: string) =>
    start(async () => {
      setRodando(i);
      const r = await gerarCapitulo(pastaId, i, aj);
      setRodando(null);
      if (r.erro) setErro(r.erro);
      else {
        toast(`Capítulo ${i + 1} reescrito`);
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="cd gap-1"><span className="kk">SEU EBOOK · {eb.idioma === "es" ? "ESPANHOL" : "INGLÊS"}</span><span className="text-lg font-bold">{eb.titulo}</span><span className="mu">{eb.subtitulo}</span></div>

      <section className="flex flex-col gap-2" aria-label="Capítulos">
        <span className="kk">PARTE 2 · CAPÍTULOS</span>
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="mu">{feitos} de {eb.capitulos.length} capítulos prontos{rodando !== null ? ` · escrevendo o capítulo ${rodando + 1}...` : ""}</span>
        </div>
        {feitos < eb.capitulos.length ? (
          <button type="button" className="b1" disabled={rodando !== null} onClick={gerarTodos}>
            {rodando !== null ? <><Spinner /> Escrevendo o capítulo {rodando + 1} de {eb.capitulos.length}...</> : feitos ? "Continuar" : "Escrever todos os capítulos com a IA"}
          </button>
        ) : null}
        {erro ? <span role="alert" className="text-sm text-danger">{erro}</span> : null}
        <button type="button" className="b3 self-start" onClick={() => setPt(!pt)}>{pt ? "Ler no idioma de venda" : "Ler com tradução (português)"}</button>
        {eb.capitulos.map((c, i) => {
          const t = c.texto ? (pt ? c.texto.pt : c.texto) : null;
          return (
            <div key={i} className="rounded-[14px] border border-line bg-surface">
              <button type="button" className="flex min-h-12 w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-3 text-left text-text" onClick={() => setAberto(aberto === i ? null : i)} aria-expanded={aberto === i}>
                <span className={`dot border-2 ${c.texto ? "border-ok bg-ok text-accent-ink" : rodando === i ? "border-accent text-accent-2" : "border-line-2 text-muted"}`} aria-hidden>{rodando === i ? <Spinner /> : c.texto ? "✓" : i + 1}</span>
                <span className="flex-1 text-sm font-semibold">{pt ? c.titulo.pt : c.titulo.x}</span>
                {c.texto ? <span className="mu" aria-hidden>{aberto === i ? "▴" : "▾"}</span> : null}
              </button>
              {aberto === i && t ? (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {t.paragrafos.map((p, k) => <p key={k} className="tx m-0">{p}</p>)}
                  {t.lista.length ? <ul className="m-0 pl-5">{t.lista.map((l, k) => <li key={k} className="tx">{l}</li>)}</ul> : null}
                  {t.destaque ? <p className="m-0 rounded-lg border-l-4 border-accent bg-surface-2 p-3 text-sm font-semibold">{t.destaque}</p> : null}
                  {t.exercicio ? <p className="m-0 rounded-lg border border-line-2 p-3 text-sm"><b>Exercício:</b> {t.exercicio}</p> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["mais simples", "mais curto", "mais exemplos"].map((aj) => (
                      <button key={aj} type="button" disabled={rodando !== null} onClick={() => ajustar(i, aj)} className="press inline-flex min-h-11 items-center rounded-[22px] border border-line-2 px-3 text-xs font-semibold text-text-2">Pedir: {aj}</button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {feitos === eb.capitulos.length ? (
        <>
          <Tema pastaId={pastaId} eb={eb} />
          <section className="cd gap-2" aria-label="PDF">
            <span className="kk">PARTE 4 · PDF FINAL</span>
            <div className="grid gap-2 sm:grid-cols-3">
              <a href={`/api/ebook/${pastaId}`} target="_blank" rel="noreferrer" className="b2 no-underline">Prévia do PDF</a>
              <a href={`/api/ebook/${pastaId}?baixar=1`} className="b1 no-underline">Baixar PDF</a>
              <a href={`/api/ebook/${pastaId}?lang=pt`} target="_blank" rel="noreferrer" className="b2 no-underline">Versão em português</a>
            </div>
            <span className="mu">A versão em português é só pra você conferir. Venda a versão no idioma do país.</span>
          </section>
          <a href={proxima} className="b1 no-underline">Ebook pronto, próxima etapa</a>
        </>
      ) : null}
    </div>
  );
}

function Tema({ pastaId, eb }: { pastaId: string; eb: NonNullable<Eb> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const t = TEMAS[(eb.tema as TemaKey) ?? "lilas"] ?? TEMAS.lilas;
  return (
    <section className="flex flex-col gap-2" aria-label="Capa e estilo">
      <span className="kk">PARTE 3 · CAPA E ESTILO</span>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div className="flex aspect-[3/4] flex-col justify-center gap-2 rounded-lg p-4 shadow-lg" style={{ background: t.capa, color: "#fff" }}>
          <span className="block h-1 w-10" style={{ background: t.destaque }} />
          <span className="text-sm font-bold leading-tight">{eb.titulo}</span>
          <span className="text-[10px] opacity-80">{eb.subtitulo}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TEMAS) as TemaKey[]).map((k) => (
            <button key={k} type="button" disabled={pending} aria-pressed={eb.tema === k} onClick={() => start(async () => { await escolherTema(pastaId, k); toast(`Tema ${TEMAS[k].nome}`); router.refresh(); })} className={`press flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-xs ${eb.tema === k ? "border-accent" : "border-line"}`} style={{ background: TEMAS[k].fundo, color: TEMAS[k].texto }}>
              <span className="flex gap-1"><span className="size-4 rounded-full" style={{ background: TEMAS[k].capa }} /><span className="size-4 rounded-full" style={{ background: TEMAS[k].destaque }} /></span>
              {TEMAS[k].nome}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
