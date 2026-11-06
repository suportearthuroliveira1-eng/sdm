"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/ui/icone";
import { Robo } from "@/components/ux/ia-trabalhando";
import { pilotoPasso, type RespPiloto } from "@/lib/actions/piloto";

type Etapa = { id: string; nome: string; fazendo: string };
const BASE: Etapa[] = [
  { id: "inicio", nome: "Começar", fazendo: "Preparando a sua pasta" },
  { id: "ideias", nome: "3 ideias de produto", fazendo: "Pensando em 3 ideias ligadas ao que você gosta" },
  { id: "escolha", nome: "Escolher a melhor ideia", fazendo: "Escolhendo a ideia que mais combina com você" },
  { id: "rascunho", nome: "Respostas da ficha", fazendo: "Escrevendo o que você sabe, a partir do diagnóstico" },
  { id: "ficha", nome: "Ficha do produto", fazendo: "Definindo pra quem é, a dor e a promessa" },
  { id: "oferta", nome: "Oferta", fazendo: "Montando nome, preço sugerido, bônus e garantia" },
  { id: "mercado", nome: "Idioma e país", fazendo: "Usando o país sugerido pelo seu diagnóstico" },
  { id: "sumario", nome: "Sumário do ebook", fazendo: "Organizando os capítulos" },
];

/** "A IA faz tudo": confirma, roda passo a passo com progresso real e para antes da Revisão. */
export function PilotoAutomatico({ pastaId, revisaoHref, titulo = "A IA faz tudo pra mim", descricao = "Ela escolhe a ideia, completa a ficha, monta a oferta e escreve o ebook. Você revisa no final.", continuar = false }: { pastaId: string; revisaoHref: string; titulo?: string; descricao?: string; continuar?: boolean }) {
  const router = useRouter();
  const [fase, setFase] = useState<"fechado" | "confirmar" | "rodando" | "erro" | "pronto">("fechado");
  const [etapas, setEtapas] = useState<Etapa[]>(BASE);
  const [atual, setAtual] = useState(0);
  const [erro, setErro] = useState("");
  const [ideia, setIdeia] = useState("");

  const rodar = async (de: number, lista: Etapa[]) => {
    setFase("rodando");
    setErro("");
    let l = lista;
    for (let i = de; i < l.length; i++) {
      setAtual(i);
      const passo = l[i]!.id as Parameters<typeof pilotoPasso>[1];
      const r: RespPiloto = await pilotoPasso(pastaId, passo).catch(() => ({ erro: "Sem conexão. Toque em tentar de novo." }));
      if (r.erro) {
        setErro(r.erro);
        setFase("erro");
        return;
      }
      if (r.ideia) setIdeia(r.ideia);
      if (passo === "sumario" && r.capitulos && !l.some((e) => e.id.startsWith("capitulo:"))) {
        l = [...l, ...Array.from({ length: r.capitulos }, (_, k) => ({ id: `capitulo:${k}`, nome: `Capítulo ${k + 1} de ${r.capitulos}`, fazendo: `Escrevendo o capítulo ${k + 1} de ${r.capitulos}, com tradução` })), { id: "extras", nome: "Introdução e conclusão", fazendo: "Escrevendo a introdução, a conclusão e os próximos passos" }];
        setEtapas(l);
      }
    }
    await pilotoPasso(pastaId, "fim").catch(() => null);
    setAtual(l.length);
    setFase("pronto");
    router.refresh();
  };

  const pct = Math.round((Math.min(atual, etapas.length) / Math.max(etapas.length, 1)) * 100);

  return (
    <>
      <button type="button" onClick={() => setFase("confirmar")} className="press surge group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border-[1.5px] border-c-amber/70 p-4 text-left text-text" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--c-amber) 18%, var(--surface)), color-mix(in srgb, var(--c-pink) 14%, var(--surface)))" }}>
        <span className="flutua grid size-14 shrink-0 place-items-center rounded-2xl bg-c-amber text-accent-ink"><Icone nome="varinha" tamanho={28} /></span>
        <span className="flex flex-col gap-0.5">
          <span className="text-[17px] font-bold">{titulo}</span>
          <span className="text-sm text-text-2">{descricao}</span>
          <span className="text-xs font-bold text-c-amber">{continuar ? "Ela continua de onde parou" : "Leva uns 4 a 5 minutos"}</span>
        </span>
      </button>

      {fase !== "fechado" ? (
        <div role="dialog" aria-modal="true" aria-label="A IA faz tudo" className="ia-fundo fixed inset-0 z-50 overflow-y-auto bg-bg/85 backdrop-blur-md">
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="ia-cartao flex w-full max-w-md flex-col gap-4 rounded-3xl border border-line bg-surface p-5 shadow-2xl">
            {fase === "confirmar" ? (
              <>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Robo tamanho={96} falando={false} />
                  <h2 className="m-0 text-xl font-bold">{continuar ? "Posso continuar de onde parei?" : "Posso montar o seu produto?"}</h2>
                  <p className="mu m-0 text-sm">Vou fazer estes passos, um de cada vez. O que já está pronto eu pulo. Tudo fica salvo e você pode mudar qualquer coisa depois.</p>
                </div>
                <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {[...BASE.slice(1).map((e) => e.nome), "Capítulos do ebook", "Introdução e conclusão"].map((t, i) => (
                    <li key={t} className="surge flex items-center gap-2 text-sm" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-c-amber/20 text-xs font-bold text-c-amber">{i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ol>
                <div className="warn text-sm">No fim eu paro na Revisão: lá é você quem confere e aprova antes de vender. Eu não publico nem vendo nada.</div>
                <div className="flex gap-2">
                  <button type="button" className="b2 w-auto px-5" onClick={() => setFase("fechado")}>Agora não</button>
                  <button type="button" className="b1 flex-1" onClick={() => rodar(0, etapas)}>Pode fazer</button>
                </div>
              </>
            ) : fase === "pronto" ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <Robo tamanho={110} falando={false} />
                <h2 className="m-0 text-xl font-bold">Pronto! Seu produto está montado</h2>
                {ideia ? <p className="m-0 font-bold text-c-amber">{ideia}</p> : null}
                <p className="mu m-0 text-sm">Agora é com você: confira a ficha, a oferta e o ebook, e faça a Revisão antes de vender.</p>
                <button type="button" className="b1" onClick={() => router.push(revisaoHref.replace(/\/revisao$/, "/pronto"))}>Ver tudo que ficou pronto</button>
                <button type="button" className="b2" onClick={() => router.push(revisaoHref)}>Ir pra Revisão</button>
                <button type="button" className="b3" onClick={() => { setFase("fechado"); router.refresh(); }}>Ver tudo na pasta</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Robo tamanho={72} />
                  <div className="flex flex-col">
                    <h2 className="m-0 text-lg font-bold">{fase === "erro" ? "Parei num passo" : "A IA está montando o seu produto"}</h2>
                    <p key={atual} className="ia-msg m-0 text-sm text-text-2">{fase === "erro" ? erro : `${etapas[atual]?.fazendo ?? "Terminando"}...`}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-line">
                    <div className="ia-barra h-full rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                  <span className="text-right text-xs text-muted">{pct}% · não feche a tela</span>
                </div>
                <ol className="m-0 flex max-h-[34dvh] list-none flex-col gap-1 overflow-y-auto p-0" aria-label="Passos">
                  {etapas.map((e, i) => {
                    const st = i < atual ? "ok" : i === atual ? (fase === "erro" ? "erro" : "agora") : "falta";
                    return (
                      <li key={e.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${st === "agora" ? "bg-sel font-bold" : ""}`}>
                        <span className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] ${st === "ok" ? "border-ok bg-ok text-accent-ink" : st === "erro" ? "border-danger text-danger" : st === "agora" ? "border-accent" : "border-line-2"}`}>
                          {st === "ok" ? <Icone nome="check" tamanho={11} espessura={3} /> : st === "erro" ? "!" : st === "agora" ? <span className="size-1.5 animate-pulse rounded-full bg-accent" /> : null}
                        </span>
                        <span className={st === "falta" ? "text-muted" : "text-text"}>{e.nome}</span>
                      </li>
                    );
                  })}
                </ol>
                {fase === "erro" ? (
                  <div className="flex gap-2">
                    <button type="button" className="b2 w-auto px-4" onClick={() => { setFase("fechado"); router.refresh(); }}>Seguir passo a passo</button>
                    <button type="button" className="b1 flex-1" onClick={() => rodar(atual, etapas)}>Tentar de novo</button>
                  </div>
                ) : null}
              </>
            )}
          </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
