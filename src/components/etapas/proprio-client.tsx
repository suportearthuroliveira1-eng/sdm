"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { CopyButton } from "@/components/pasta/copy-button";
import { ItemAcoes } from "@/components/pasta/acoes";
import { Spinner, SubmitButton } from "@/components/ux/submit-button";
import { toast } from "@/components/ux/toaster";
import { IaTrabalhando } from "@/components/ux/ia-trabalhando";
import { avaliarIdeia, definirMercado, editarBloco, editarFicha, escolherIdeia, gerarFicha, rascunhoFicha, salvarRespostasFicha } from "@/lib/actions/caminhos";
import { Icone } from "@/components/ui/icone";

type R = { ok?: boolean; erro?: string };
type Bi = { x: string; pt: string };

export function EscolherIdeia({ pastaId, idx, escolhida }: { pastaId: string; idx: number; escolhida: boolean }) {
  return (
    <form action={escolherIdeia.bind(null, pastaId, idx)} className="mt-auto">
      <SubmitButton className={escolhida ? "b2 w-full" : "b1 min-h-[46px] text-sm"} pendente="Escolhendo...">{escolhida ? "Escolhida · usar de novo" : "Escolher esta"}</SubmitButton>
    </form>
  );
}

export function AvaliarIdeia({ pastaId }: { pastaId: string }) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const [st, action, avaliando] = useActionState(async (p: R | null, f: FormData) => {
    const r: R = await avaliarIdeia(pastaId, p, f).catch(() => ({ erro: "Não deu certo agora. Confira a internet e tente de novo." }));
    if (r.ok) {
      toast("A IA avaliou a sua ideia");
      setAberto(false);
      router.refresh();
    }
    return r;
  }, null as R | null);
  if (!aberto) return <button type="button" className="b3 self-start" onClick={() => setAberto(true)}>Tenho minha própria ideia (a IA avalia)</button>;
  return (
    <form action={action} className="cd gap-2">
      <label htmlFor="ideia" className="lb">Sua ideia de produto</label>
      <textarea id="ideia" name="ideia" required minLength={10} maxLength={1000} className="ta" placeholder="Ex.: um guia de marmitas pra semana inteira pra quem trabalha fora" />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="A IA está avaliando...">Avaliar com a IA</SubmitButton>
      <IaTrabalhando ativo={avaliando} titulo="A IA está avaliando a sua ideia" passos={["Lendo a sua ideia", "Vendo se é clara e específica", "Pensando em quem compraria", "Sugerindo um ajuste, se precisar"]} duracao={12} />
    </form>
  );
}

/** Formulário com campos de texto que chama uma ação de IA (mostra o robô enquanto ela trabalha). */
export function FormIa({ acao, campos, botao, carregando, passos, duracao = 15 }: { acao: (p: R | null, f: FormData) => Promise<R>; campos: { name: string; label: string; ajuda?: string; valor?: string }[]; botao: string; carregando: string; passos?: string[]; duracao?: number }) {
  const router = useRouter();
  const [st, action, pend] = useActionState(async (p: R | null, f: FormData) => {
    const r: R = await acao(p, f).catch(() => ({ erro: "Não deu certo agora. Confira a internet e tente de novo." }));
    if (r.ok) {
      toast("Pronto!");
      router.refresh();
    }
    return r;
  }, null as R | null);
  return (
    <form action={action} className="flex flex-col gap-3">
      {campos.map((c) => (
        <div key={c.name} className="flex flex-col gap-1.5">
          <label htmlFor={c.name} className="lb">{c.label}</label>
          {c.ajuda ? <span className="mu">{c.ajuda}</span> : null}
          <textarea id={c.name} name={c.name} defaultValue={c.valor} maxLength={1500} className="ta" />
        </div>
      ))}
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente={carregando}>{botao}</SubmitButton>
      <IaTrabalhando ativo={pend} titulo={carregando.replace(/\.+$/, "")} passos={passos} duracao={duracao} />
    </form>
  );
}

type Ficha = { nome: string; publico: Bi; dor: Bi; promessa: Bi; o_que_e: Bi; provas_reais: string[]; objecoes: Bi[]; nao_prometer: string[]; ganchos: Bi[]; por_que_funciona: string };

export function FichaEditavel({ pastaId, ficha }: { pastaId: string; ficha: Ficha }) {
  const campos: [keyof Ficha, string, string, string][] = [
    ["nome", "Nome", ficha.nome, ""],
    ["publico", "Pra quem é", ficha.publico.x, ficha.publico.pt],
    ["dor", "Dor", ficha.dor.x, ficha.dor.pt],
    ["promessa", "Promessa", ficha.promessa.x, ficha.promessa.pt],
    ["o_que_e", "O que é", ficha.o_que_e.x, ficha.o_que_e.pt],
  ];
  return (
    <div className="flex flex-col gap-2">
      <span className="kk">SUA FICHA</span>
      <dl className="m-0 flex flex-col rounded-2xl border border-line bg-surface">
        {campos.map(([k, l, x, pt]) => <CampoFicha key={k} pastaId={pastaId} campo={k} label={l} x={x} pt={pt} />)}
        <Linha label="Provas reais" v={ficha.provas_reais.length ? ficha.provas_reais.join(" · ") : "Nenhuma (a IA não inventa prova)"} />
        <Linha label="Objeções" v={ficha.objecoes.map((o) => o.pt).join(" · ") || "—"} />
        <Linha label="Não prometer" v={ficha.nao_prometer.join(" · ") || "—"} />
        <Linha label="Ganchos" v={ficha.ganchos.map((g) => g.x).join(" · ")} />
      </dl>
      <div className="cd"><span className="kk">POR QUE FUNCIONA</span><span className="tx">{ficha.por_que_funciona}</span></div>
    </div>
  );
}

function Linha({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex gap-2.5 border-b border-line-3 px-3.5 py-[11px] last:border-0">
      <dt className="w-[110px] flex-none text-xs font-semibold text-muted">{label}</dt>
      <dd className="m-0 flex-1 break-words text-[13px] leading-snug">{v}</dd>
    </div>
  );
}

function CampoFicha({ pastaId, campo, label, x, pt }: { pastaId: string; campo: string; label: string; x: string; pt: string }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(x);
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2.5 border-b border-line-3 px-3.5 py-[11px]">
      <dt className="w-[110px] flex-none text-xs font-semibold text-muted">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        {edit ? (
          <>
            <textarea aria-label={label} value={v} onChange={(e) => setV(e.target.value)} className="ta min-h-16" />
            <div className="flex gap-2">
              <button type="button" className="b1 min-h-10 w-auto px-4 text-sm" disabled={pending} onClick={() => start(async () => { const r = await editarFicha(pastaId, campo, v); if (r.ok) { toast("Campo corrigido"); setEdit(false); router.refresh(); } })}>{pending ? <Spinner /> : "Salvar"}</button>
              <button type="button" className="b3" onClick={() => setEdit(false)}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[13px] leading-snug">{x}</span>
            {pt && pt !== x ? <span className="mu">{pt}</span> : null}
            <button type="button" className="b3 min-h-9 self-start px-0 text-xs" onClick={() => setEdit(true)}>Corrigir este campo</button>
          </>
        )}
      </dd>
    </div>
  );
}

export function OfertaForm({ acao, nome, nomePt, promessa, promessaPt, preco, aprovada, proxima }: { pastaId: string; acao: (p: R | null, f: FormData) => Promise<R>; nome: string; nomePt: string; promessa: string; promessaPt: string; preco: number; aprovada: boolean; proxima: string }) {
  const router = useRouter();
  const [st, action] = useActionState(async (p: R | null, f: FormData) => {
    const r = await acao(p, f);
    if (r.ok) {
      toast("Oferta aprovada");
      router.push(proxima);
    }
    return r;
  }, null as R | null);
  return (
    <form action={action} className="cd gap-2.5 border border-accent">
      <span className="kk">REVISE E APROVE</span>
      <label htmlFor="of-nome" className="lb">Nome do produto</label>
      <input id="of-nome" name="nome" defaultValue={nome} className="in" />
      {nomePt !== nome ? <span className="mu">{nomePt}</span> : null}
      <label htmlFor="of-prom" className="lb">Promessa</label>
      <textarea id="of-prom" name="promessa" defaultValue={promessa} className="ta min-h-16" />
      {promessaPt !== promessa ? <span className="mu">{promessaPt}</span> : null}
      <label htmlFor="of-preco" className="lb">Preço</label>
      <input id="of-preco" name="preco" inputMode="decimal" defaultValue={preco > 0 ? preco : ""} placeholder="ex.: 9" className="in w-40" />
      {st?.erro ? <span role="alert" className="text-sm text-danger">{st.erro}</span> : null}
      <SubmitButton pendente="Aprovando...">{aprovada ? "Salvar e seguir" : "Aprovar a oferta"}</SubmitButton>
    </form>
  );
}

type Bloco = { n: string; oq: string; x: string; pt: string };

export function PaginaEditor({ itemId, status, blocos, formato }: { itemId: string; status: string; blocos: Bloco[]; formato: string }) {
  const router = useRouter();
  const [pt, setPt] = useState(false);
  const [prev, setPrev] = useState<"lista" | "celular" | "computador">("lista");
  const [edit, setEdit] = useState<number | null>(null);
  const [txt, setTxt] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="kk">{formato === "quiz" ? "QUIZ" : formato === "pre" ? "PRÉ-VENDA" : "PÁGINA DE VENDAS"} · {blocos.length} BLOCOS</span>
        <ItemAcoes id={itemId} status={status} />
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Visualização">
        {(["lista", "celular", "computador"] as const).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={prev === v} onClick={() => setPrev(v)} className={`press min-h-11 rounded-[22px] border px-3 text-xs font-semibold ${prev === v ? "border-accent bg-sel text-text" : "border-line-2 text-text-2"}`}>
            {v === "lista" ? "Editar blocos" : v === "celular" ? "Prévia no celular" : "Prévia no computador"}
          </button>
        ))}
        <button type="button" onClick={() => setPt(!pt)} className="press min-h-11 rounded-[22px] border border-line-2 px-3 text-xs font-semibold text-text-2">{pt ? "Ver no idioma de venda" : "Ver tradução"}</button>
      </div>
      {prev === "lista" ? (
        blocos.map((b, i) => (
          <div key={i} className="cd gap-1.5 border border-line">
            <div className="flex items-center justify-between gap-2">
              <span className="kk">{b.n}</span>
              <CopyButton text={b.x} />
            </div>
            {edit === i ? (
              <>
                <textarea aria-label={`Editar ${b.n}`} value={txt} onChange={(e) => setTxt(e.target.value)} className="ta" />
                <div className="flex gap-2">
                  <button type="button" className="b1 min-h-10 w-auto px-4 text-sm" disabled={pending} onClick={() => start(async () => { const r = await editarBloco(itemId, i, txt); if (r.ok) { toast("Bloco salvo"); setEdit(null); router.refresh(); } })}>{pending ? <Spinner /> : "Salvar bloco"}</button>
                  <button type="button" className="b3" onClick={() => setEdit(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <span className="whitespace-pre-line text-[15px] leading-normal">{pt ? b.pt : b.x}</span>
            )}
            <span className="mu">Por que está aqui: {b.oq}</span>
            {edit !== i ? <button type="button" className="b3 min-h-9 self-start px-0 text-xs" onClick={() => { setEdit(i); setTxt(b.x); }}>Editar este bloco</button> : null}
          </div>
        ))
      ) : (
        <div className={`mx-auto w-full overflow-hidden rounded-[22px] border-4 border-line-2 bg-white text-[#1E1A2B] ${prev === "celular" ? "max-w-[375px]" : "max-w-[900px]"}`}>
          <div className="flex flex-col gap-4 p-6">
            {blocos.map((b, i) => {
              const t = pt ? b.pt : b.x;
              const ultimo = i === blocos.length - 1;
              return i === 0 ? (
                <h2 key={i} className="m-0 text-2xl font-bold leading-tight">{t}</h2>
              ) : ultimo ? (
                <span key={i} className="self-center rounded-full bg-[#7C5CE0] px-6 py-3 font-bold text-white">{t}</span>
              ) : (
                <p key={i} className="m-0 whitespace-pre-line leading-relaxed">{t}</p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** B · Idioma e país: escolher e confirmar (salva e segue). */
export function MercadoEscolha({ pastaId, atual, sugerido, proxima, info, preco }: { pastaId: string; atual: string | null; sugerido: string | null; proxima: string; info: Record<string, { nome: string; idioma: string; moeda: string; porque: string }>; preco: number | null }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(atual ?? sugerido);
  const [pend, start] = useTransition();
  const [erro, setErro] = useState("");
  const [valor, setValor] = useState(preco && preco > 0 ? String(preco) : "");
  const confirmar = () =>
    start(async () => {
      if (!sel) return;
      const n = Number(valor.replace(",", "."));
      const r: R = await definirMercado(pastaId, sel, valor.trim() ? n : null).catch(() => ({ erro: "Sem conexão. Tente de novo." }));
      if (r.erro) return setErro(r.erro);
      toast(`Vai vender em ${info[sel]?.idioma.toLowerCase()}`);
      router.push(proxima);
    });
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Pra quem você vai vender" className="grid gap-2.5 sm:grid-cols-2">
        {Object.entries(info).map(([k, m], i) => {
          const on = sel === k;
          return (
            <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setSel(k)} style={{ animationDelay: `${i * 60}ms` }} className={`surge press flex flex-col items-start gap-1.5 rounded-2xl border-[1.5px] p-4 text-left text-text transition-colors ${on ? "border-c-sky bg-[color-mix(in_srgb,var(--c-sky)_12%,transparent)]" : "border-line bg-surface hover:border-c-sky/60"}`}>
              {sugerido === k ? <span className="rounded-lg bg-c-sky/15 px-2 py-0.5 text-[11px] font-bold text-c-sky">SUGERIDO PELO DIAGNÓSTICO</span> : null}
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-[17px] font-bold">{m.nome}</span>
                <span aria-hidden className={`grid size-6 place-items-center rounded-full border-[1.5px] ${on ? "border-c-sky bg-c-sky text-accent-ink" : "border-line-2"}`}>{on ? <Icone nome="check" tamanho={13} espessura={3} /> : null}</span>
              </span>
              <span className="text-sm text-text-2">{m.idioma} · {m.moeda}</span>
              <span className="mu text-sm">{m.porque}</span>
            </button>
          );
        })}
      </div>
      {sel ? (
        <div className="surge cd gap-1.5">
          <label htmlFor="mk-preco" className="lb">Preço do ebook em {info[sel]?.moeda} <span className="font-normal text-muted">(opcional, dá pra mudar depois)</span></label>
          <input id="mk-preco" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="ex.: 9" className="in w-40" />
          <span className="mu">Ebook curto costuma ter preço de entrada. Você decide: a IA não inventa número.</span>
        </div>
      ) : null}
      {erro ? <span role="alert" className="text-sm text-danger">{erro}</span> : null}
      <button type="button" className="b1" disabled={!sel || pend} onClick={confirmar}>
        {pend ? <><Spinner /> Salvando...</> : sel ? `Confirmar: vender em ${info[sel]?.idioma.toLowerCase()}` : "Escolha um país"}
      </button>
    </div>
  );
}

const PERGUNTAS_FICHA = [
  { k: "o_que_sabe", n: 1, t: "O que você sabe desse assunto?", obrigatoria: true, ajuda: "Com as suas palavras: o que você faz, aprendeu ou já ensinou pra alguém.", ex: "Ex.: faço minha maquiagem todo dia em 10 minutos e ensino as amigas a montar uma rotina com poucos produtos." },
  { k: "historia_real", n: 2, t: "Tem alguma história real?", obrigatoria: false, ajuda: "Algo que aconteceu de verdade com você ou com alguém. A IA só usa como prova o que você contar aqui, nunca inventa.", ex: "Ex.: minha irmã gastava muito com maquiagem e, com a minha rotina, passou a usar só 5 produtos." },
  { k: "nao_prometer", n: 3, t: "O que você NÃO quer prometer?", obrigatoria: false, ajuda: "Pra IA não escrever nada que você não pode cumprir.", ex: "Ex.: pele perfeita, resultado em X dias, emagrecimento." },
] as const;

/** B2 · as 3 perguntas da ficha: salva ao sair do campo, a IA pode preencher um rascunho, botão diz o que falta. */
export function FichaPerguntas({ pastaId, inicial, temFicha }: { pastaId: string; inicial: Record<string, string>; temFicha: boolean }) {
  const router = useRouter();
  const [v, setV] = useState<{ o_que_sabe: string; historia_real: string; nao_prometer: string }>({ o_que_sabe: inicial.o_que_sabe ?? "", historia_real: inicial.historia_real ?? "", nao_prometer: inicial.nao_prometer ?? "" });
  const [dica, setDica] = useState("");
  const [erro, setErro] = useState("");
  const [preenchendo, startP] = useTransition();
  const [gerando, startG] = useTransition();
  const [salvo, setSalvo] = useState<string | null>(null);
  const falta = v.o_que_sabe.trim().length < 10;

  const salvar = (k: string) => {
    if ((inicial[k] ?? "") === v[k as keyof typeof v]) return;
    salvarRespostasFicha(pastaId, { [k]: v[k as keyof typeof v] ?? "" })
      .then(() => setSalvo(k))
      .catch(() => {});
  };
  const preencher = () =>
    startP(async () => {
      setErro("");
      const r = await rascunhoFicha(pastaId).catch(() => ({ erro: "Sem conexão. Tente de novo." }) as { erro: string; o_que_sabe?: string; nao_prometer?: string; dica?: string });
      if (r.erro) return setErro(r.erro);
      setV((a) => ({ ...a, o_que_sabe: r.o_que_sabe ?? a.o_que_sabe, nao_prometer: a.nao_prometer || r.nao_prometer || "" }));
      setDica(r.dica ?? "");
      toast("Rascunho pronto: confira e mude o que quiser");
    });
  const gerar = () =>
    startG(async () => {
      setErro("");
      const f = new FormData();
      Object.entries(v).forEach(([k, x]) => f.set(k, x));
      const r: R = await gerarFicha(pastaId, null, f).catch(() => ({ erro: "Não deu certo agora. Confira a internet e tente de novo." }));
      if (r.erro) return setErro(r.erro);
      toast("Ficha pronta");
      router.refresh();
      setTimeout(() => document.getElementById("sua-ficha")?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    });

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={preencher} disabled={preenchendo || gerando} className="press surge flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-c-teal/70 bg-[color-mix(in_srgb,var(--c-teal)_8%,transparent)] p-4 text-left text-text hover:bg-[color-mix(in_srgb,var(--c-teal)_14%,transparent)]">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-c-teal text-accent-ink">{preenchendo ? <Spinner /> : <Icone nome="varinha" tamanho={22} />}</span>
        <span className="flex flex-col">
          <span className="font-bold">{preenchendo ? "A IA está escrevendo um rascunho..." : "Não sabe o que escrever? A IA preenche pra mim"}</span>
          <span className="mu text-sm">Ela usa o seu diagnóstico e a ideia escolhida. Você confere e muda o que quiser.</span>
        </span>
      </button>
      {dica ? <div className="good surge">Dica da IA: {dica}</div> : null}

      {PERGUNTAS_FICHA.map((q) => {
        const ok = v[q.k].trim().length >= (q.obrigatoria ? 10 : 1);
        return (
          <div key={q.k} className="flex gap-3">
            <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors ${ok ? "border-ok bg-ok text-accent-ink" : "border-c-teal text-c-teal"}`} aria-hidden>
              {ok ? <Icone nome="check" tamanho={15} espessura={3} /> : q.n}
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor={`f-${q.k}`} className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
                {q.t}
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${q.obrigatoria ? "bg-c-teal/15 text-c-teal" : "bg-surface-2 text-muted"}`}>{q.obrigatoria ? "obrigatória" : "opcional"}</span>
                {salvo === q.k ? <span className="text-[11px] font-normal text-ok">salvo</span> : null}
              </label>
              <span className="mu text-sm">{q.ajuda}</span>
              <textarea id={`f-${q.k}`} value={v[q.k]} maxLength={1500} placeholder={q.ex} onChange={(e) => setV({ ...v, [q.k]: e.target.value })} onBlur={() => salvar(q.k)} className="ta min-h-24" />
              {q.obrigatoria && falta ? <span className="text-xs text-muted">{v[q.k].trim().length}/10 letras no mínimo</span> : null}
            </div>
          </div>
        );
      })}

      {erro ? <span role="alert" className="text-sm text-danger">{erro}</span> : null}
      <div className="sticky bottom-[calc(64px+max(env(safe-area-inset-bottom),12px))] z-10 -mx-4 flex flex-col gap-1.5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-t-2xl lg:border-x">
        <button type="button" className="b1" onClick={gerar} disabled={falta || gerando || preenchendo}>
          <Icone nome="varinha" tamanho={18} /> {temFicha ? "Refazer a ficha com a IA" : "Gerar a ficha com a IA"}
        </button>
        <span className="text-center text-xs text-muted">{falta ? "Responda a pergunta 1 (ou toque em \"A IA preenche pra mim\") pra liberar." : "A IA usa as suas respostas + a ideia escolhida. Leva uns 10 segundos."}</span>
      </div>
      <IaTrabalhando ativo={gerando} titulo="A IA está montando a sua ficha" passos={["Lendo a ideia escolhida", "Lendo o que você sabe", "Definindo pra quem é e qual a dor", "Escrevendo a promessa sem exagero", "Listando objeções e ganchos", "Conferindo: só prova que você contou"]} duracao={12} />
    </div>
  );
}
