"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Notice } from "@/components/ui/screen";
import { Spinner } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { apagarAula, apagarTrilha, enviarImagem, moverAula, removerImagem, salvarAula, salvarTrilha, type AulasState } from "@/lib/actions/admin-aulas";
import { REGRA_LABEL, REGRAS_LIBERACAO, type TipoImagem } from "@/lib/domain/aulas-visual";
import { PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain/entitlements";

const lb = "lb mb-1.5 block text-muted";

function useAviso(state: AulasState) {
  useEffect(() => {
    if (state?.ok && state.msg) toast(state.msg);
  }, [state]);
}

export type TrilhaDados = { id: string; nome: string; parte: string | null; objetivo: string | null; regraLiberacao: string; ordem: number; cor: string | null };

export function TrilhaForm({ modo, inicial, partes }: { modo: "criar" | "editar"; inicial?: TrilhaDados; partes: string[] }) {
  const [state, action, pending] = useActionState(salvarTrilha, null as AulasState);
  useAviso(state);
  const [cor, setCor] = useState(inicial?.cor ?? "");
  const p = modo === "criar" ? "nt" : "et";
  return (
    <form action={action} className="acd gap-4">
      <input type="hidden" name="modo" value={modo} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${p}-id`} className={lb}>Código da trilha</label>
          <input id={`${p}-id`} name="id" required maxLength={12} pattern="[A-Za-z0-9.\-]{1,12}" defaultValue={inicial?.id} readOnly={modo === "editar"} className={`ain ${modo === "editar" ? "opacity-70" : ""}`} placeholder="ex.: M7" aria-describedby={`${p}-id-a`} />
          <span id={`${p}-id-a`} className="mu">{modo === "editar" ? "O código não muda depois de criado." : "Letras, números, ponto ou hífen. Não dá pra trocar depois."}</span>
        </div>
        <div>
          <label htmlFor={`${p}-nome`} className={lb}>Nome</label>
          <input id={`${p}-nome`} name="nome" required maxLength={120} defaultValue={inicial?.nome} className="ain" />
        </div>
        <div>
          <label htmlFor={`${p}-parte`} className={lb}>Parte (agrupa as trilhas na tela de aulas)</label>
          <input id={`${p}-parte`} name="parte" maxLength={80} defaultValue={inicial?.parte ?? ""} list={`${p}-partes`} className="ain" />
          <datalist id={`${p}-partes`}>{partes.map((x) => <option key={x} value={x} />)}</datalist>
        </div>
        <div>
          <label htmlFor={`${p}-regra`} className={lb}>Quando libera</label>
          <select id={`${p}-regra`} name="regraLiberacao" defaultValue={inicial?.regraLiberacao ?? "compra"} className="ain">
            {REGRAS_LIBERACAO.map((r) => <option key={r} value={r}>{REGRA_LABEL[r]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${p}-ordem`} className={lb}>Ordem (vazio = no fim)</label>
          <input id={`${p}-ordem`} name="ordem" type="number" inputMode="numeric" min={0} defaultValue={inicial?.ordem ?? ""} className="ain" />
        </div>
        <div>
          <label htmlFor={`${p}-cor`} className={lb}>Cor da trilha (opcional)</label>
          <div className="flex items-center gap-2">
            <input type="color" aria-label="Escolher cor" value={cor || "#a98bff"} onChange={(e) => setCor(e.target.value)} className="size-11 shrink-0 cursor-pointer rounded-xl border border-line-2 bg-transparent p-1" />
            <input id={`${p}-cor`} name="cor" value={cor} maxLength={7} onChange={(e) => setCor(e.target.value)} placeholder="#RRGGBB" className="ain font-mono" />
            {cor ? <button type="button" className="ab2" onClick={() => setCor("")}>Sem cor</button> : null}
          </div>
        </div>
      </div>
      <div>
        <label htmlFor={`${p}-obj`} className={lb}>Objetivo da trilha</label>
        <textarea id={`${p}-obj`} name="objetivo" maxLength={2000} defaultValue={inicial?.objetivo ?? ""} className="ain min-h-24 py-2.5" />
      </div>
      {state?.erro ? <Notice tone="danger">{state.erro}</Notice> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? <><Spinner /> Salvando...</> : modo === "criar" ? "Criar trilha" : "Salvar trilha"}</button>
    </form>
  );
}

export type AulaDados = {
  id: string;
  moduleId: string;
  titulo: string;
  tipo: string | null;
  minutos: number | null;
  objetivo: string | null;
  agoraFacaTexto: string | null;
  agoraFacaAlvo: string | null;
  videoUrl: string | null;
  requerEntitlements: string[];
  ordem: number | null;
  publicada: boolean;
  regravar: boolean;
};

export function AulaForm({ modo, inicial, trilhas }: { modo: "criar" | "editar"; inicial: AulaDados; trilhas: { id: string; nome: string }[] }) {
  const [state, action, pending] = useActionState(salvarAula, null as AulasState);
  useAviso(state);
  return (
    <form action={action} className="acd gap-4">
      <input type="hidden" name="modo" value={modo} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="a-id" className={lb}>Código da aula</label>
          <input id="a-id" name="id" required maxLength={16} pattern="[A-Za-z0-9.\-]{1,16}" defaultValue={inicial.id} readOnly={modo === "editar"} className={`ain ${modo === "editar" ? "opacity-70" : ""}`} placeholder="ex.: 7.1" aria-describedby="a-id-a" />
          <span id="a-id-a" className="mu">{modo === "editar" ? "O código não muda depois de criado." : "Letras, números, ponto ou hífen. Não dá pra trocar depois."}</span>
        </div>
        <div>
          <label htmlFor="a-trilha" className={lb}>Trilha</label>
          <select id="a-trilha" name="moduleId" required defaultValue={inicial.moduleId} className="ain">
            {trilhas.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.nome}</option>)}
          </select>
          <span className="mu">Trocar aqui move a aula pra outra trilha.</span>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="a-titulo" className={lb}>Título</label>
          <input id="a-titulo" name="titulo" required maxLength={200} defaultValue={inicial.titulo} className="ain" />
        </div>
        <div>
          <label htmlFor="a-tipo" className={lb}>Tipo (ex.: aula, prática, ao vivo)</label>
          <input id="a-tipo" name="tipo" maxLength={60} defaultValue={inicial.tipo ?? ""} className="ain" />
        </div>
        <div>
          <label htmlFor="a-min" className={lb}>Duração (minutos)</label>
          <input id="a-min" name="minutos" type="number" inputMode="numeric" min={0} max={600} defaultValue={inicial.minutos ?? ""} className="ain" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="a-video" className={lb}>Link do vídeo (https)</label>
          <input id="a-video" name="videoUrl" type="url" maxLength={500} defaultValue={inicial.videoUrl ?? ""} placeholder="https://..." className="ain" />
        </div>
        <div>
          <label htmlFor="a-ordem" className={lb}>Ordem (vazio = no fim da trilha)</label>
          <input id="a-ordem" name="ordem" type="number" inputMode="numeric" min={0} defaultValue={inicial.ordem ?? ""} className="ain" />
        </div>
        <div>
          <label htmlFor="a-alvo" className={lb}>&quot;Agora faça&quot; leva pra (id da tela, fora ou pergunta)</label>
          <input id="a-alvo" name="agoraFacaAlvo" maxLength={60} defaultValue={inicial.agoraFacaAlvo ?? ""} className="ain" />
        </div>
      </div>
      <div>
        <label htmlFor="a-obj" className={lb}>Objetivo da aula</label>
        <textarea id="a-obj" name="objetivo" maxLength={2000} defaultValue={inicial.objetivo ?? ""} className="ain min-h-24 py-2.5" />
      </div>
      <div>
        <label htmlFor="a-faca" className={lb}>Texto do &quot;Agora faça&quot;</label>
        <textarea id="a-faca" name="agoraFacaTexto" maxLength={1000} defaultValue={inicial.agoraFacaTexto ?? ""} className="ain min-h-20 py-2.5" />
      </div>
      <fieldset>
        <legend className={lb}>Quem vê (vazio = quem comprou o SDM; marcado = qualquer um destes libera)</legend>
        <div className="flex flex-wrap gap-2">
          {PRODUCTS.map((p) => (
            <label key={p} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input type="checkbox" name={`req_${p}`} defaultChecked={inicial.requerEntitlements.includes(p)} className="size-4 accent-[var(--accent)]" />
              {PRODUCT_LABEL[p as Product]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
          <input type="checkbox" name="publicada" defaultChecked={inicial.publicada} className="size-4 accent-[var(--accent)]" />
          Publicada (aparece pras alunas)
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
          <input type="checkbox" name="regravar" defaultChecked={inicial.regravar} className="size-4 accent-[var(--accent)]" />
          Precisa regravar
        </label>
      </div>
      {state?.erro ? <Notice tone="danger">{state.erro}</Notice> : null}
      <button className="ab1 self-start" disabled={pending}>{pending ? <><Spinner /> Salvando...</> : modo === "criar" ? "Criar aula" : "Salvar aula"}</button>
    </form>
  );
}

/** Capa ou banner com prévia: escolher, trocar e remover. */
export function ImagemUpload({ tipo, id, url, titulo, ajuda, formato = "capa" }: { tipo: TipoImagem; id: string; url: string | null; titulo: string; ajuda?: string; formato?: "capa" | "banner" }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [atual, setAtual] = useState(url);
  const [erro, setErro] = useState<string | null>(null);
  const [pend, start] = useTransition();
  const campo = `img-${tipo}-${id}`;
  const rodar = (f: () => Promise<AulasState>) =>
    start(async () => {
      setErro(null);
      const r: AulasState = await f().catch(() => ({ erro: "Sem conexão ou imagem grande demais. Tente de novo." }));
      if (r?.ok) {
        setAtual(r.url ?? null);
        toast(r.msg ?? "Salvo");
        router.refresh();
      } else setErro(r?.erro ?? "Não deu certo.");
      if (ref.current) ref.current.value = "";
    });
  const enviar = (arq: File | undefined) => {
    if (!arq) return;
    if (arq.size > 4 * 1024 * 1024) {
      setErro("Imagem grande demais (máx. 4 MB).");
      return;
    }
    const fd = new FormData();
    fd.set("imagem", arq);
    rodar(() => enviarImagem(tipo, id, fd));
  };
  return (
    <div className="flex flex-col gap-2">
      <span id={`${campo}-t`} className="text-sm font-bold">{titulo}</span>
      <div className={`relative overflow-hidden rounded-xl border border-line bg-bg ${formato === "banner" ? "aspect-[16/6]" : "aspect-video"} w-full max-w-md`}>
        {atual ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={atual} alt={`${titulo} atual`} className="size-full object-cover" />
        ) : (
          <span className="mu grid size-full place-items-center">Sem imagem</span>
        )}
        {pend ? <span className="absolute inset-0 grid place-items-center bg-bg/70"><Spinner /></span> : null}
      </div>
      {ajuda ? <span className="mu">{ajuda}</span> : null}
      <input ref={ref} id={campo} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-labelledby={`${campo}-t`} onChange={(e) => enviar(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ab2" disabled={pend} onClick={() => ref.current?.click()}>{atual ? "Trocar" : "Escolher imagem"}</button>
        {atual ? (
          <button type="button" className="ab2" disabled={pend} onClick={() => { if (confirm("Remover esta imagem?")) rodar(() => removerImagem(tipo, id)); }}>Remover</button>
        ) : null}
      </div>
      {erro ? <Notice tone="danger">{erro}</Notice> : null}
    </div>
  );
}

/** Setas de subir/descer a aula na trilha. */
export function MoverAula({ id, titulo, primeiro, ultimo }: { id: string; titulo: string; primeiro: boolean; ultimo: boolean }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const mover = (d: "up" | "down") =>
    start(async () => {
      const r = await moverAula(id, d).catch(() => ({ erro: "Sem conexão. Tente de novo." }) as AulasState);
      if (r?.erro) toast(r.erro);
      router.refresh();
    });
  const btn = "grid size-11 place-items-center rounded-xl border border-line-2 text-text hover:bg-surface-2 disabled:opacity-30";
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" className={btn} disabled={pend || primeiro} onClick={() => mover("up")} aria-label={`Subir ${titulo}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M6 15l6-6 6 6" /></svg>
      </button>
      <button type="button" className={btn} disabled={pend || ultimo} onClick={() => mover("down")} aria-label={`Descer ${titulo}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </span>
  );
}

/** Botão de apagar (aula não publicada / trilha vazia). Volta pra lista ao apagar. */
export function Apagar({ tipo, id, bloqueio }: { tipo: "aula" | "trilha"; id: string; bloqueio?: string | null }) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const nome = tipo === "aula" ? "aula" : "trilha";
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="ab2 self-start border-danger/50 text-danger"
        disabled={pend || Boolean(bloqueio)}
        onClick={() => {
          if (!confirm(`Apagar a ${nome} ${id}? Não dá pra desfazer.`)) return;
          start(async () => {
            const r: AulasState = await (tipo === "aula" ? apagarAula(id) : apagarTrilha(id)).catch(() => ({ erro: "Sem conexão. Tente de novo." }));
            if (r?.ok) {
              toast(r.msg ?? "Apagado");
              router.push("/admin/aulas");
            } else setErro(r?.erro ?? "Não deu certo.");
          });
        }}
      >
        {pend ? <><Spinner /> Apagando...</> : `Apagar ${nome}`}
      </button>
      {bloqueio ? <span className="mu">{bloqueio}</span> : null}
      {erro ? <Notice tone="danger">{erro}</Notice> : null}
    </div>
  );
}
