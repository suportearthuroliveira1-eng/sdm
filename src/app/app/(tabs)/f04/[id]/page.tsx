import type { Metadata } from "next";
import Link from "next/link";
import { GerarButton, ItemAcoes } from "@/components/pasta/acoes";
import { CopyButton } from "@/components/pasta/copy-button";
import { PastaHead } from "@/components/pasta/head";
import { LangProvider, T } from "@/components/pasta/lang";
import type { Bi, Bloco, QuizPergunta } from "@/lib/gen/modelo";
import { getPasta, itensDaPasta } from "@/lib/server/pasta";
import { getSetting } from "@/lib/server/settings";
import { Quiz } from "./quiz";

export const metadata: Metadata = { title: "Kit da página" };

// F04 · Kit da pré-venda (7 blocos) ou do quiz (3 perguntas + resultado), com tradução e copiar.
export default async function F04({ params }: PageProps<"/app/f04/[id]">) {
  const { id } = await params;
  const { pasta, vit } = await getPasta(id);
  const itens = await itensDaPasta(pasta.id);
  const kit = itens.find((i) => i.tipo === (pasta.funil === "quiz" ? "kit_quiz" : "kit_pre"));
  const ferramenta = await getSetting<string>("PAGE_TOOL_NAME", "[ferramenta a definir]");
  const nomeKit = pasta.funil === "quiz" ? "quiz" : "página de pré-venda";
  const c = kit?.conteudo as { blocos: Bloco[]; quiz?: QuizPergunta[]; resultado?: Bi; imagemPrompt?: string } | undefined;

  return (
    <div className="flex flex-col gap-3.5 lg:max-w-3xl">
      <PastaHead id={pasta.id} code={pasta.code} produto={vit?.nome ?? ""} k="ETAPA 2 · SUA ESTRUTURA" t={pasta.funil === "direto" ? "Funil direto" : `Kit da sua ${nomeKit}`} />
      {pasta.funil === "direto" ? (
        <>
          <div className="cd"><span className="tx">No funil direto você não monta página: o anúncio ou o link da bio vai direto pra página do produtor, pelo seu link de afiliada.</span></div>
          <Link href={`/app/dv01/${pasta.id}`} className="b1 no-underline">Próximo: divulgação</Link>
          <Link href={`/app/f02/${pasta.id}`} className="b3 self-start">Trocar o funil</Link>
        </>
      ) : !c ? (
        <>
          <p className="tx">O kit ainda não foi gerado.</p>
          <GerarButton pastaId={pasta.id} tipo="kit" label={`Gerar o kit da ${nomeKit}`} />
        </>
      ) : (
        <LangProvider idioma={kit!.idioma ?? "en"}>
          <p className="tx text-[13px]">Este é o texto pronto da sua {nomeKit}, bloco por bloco, na ordem. Você copia e cola no modelo do SDM na {ferramenta}.</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="mu">{kit!.code} · versão {kit!.versao} · {kit!.status}</span>
            <ItemAcoes id={kit!.id} status={kit!.status} />
          </div>
          {c.blocos.map((b) => (
            <div key={b.n} className="cd gap-1.5 border border-line">
              <div className="flex items-center justify-between gap-2">
                <span className="kk">{b.n}</span>
                <CopyButton text={b.x} />
              </div>
              <span className="text-[15px] leading-normal"><T x={b.x} pt={b.pt} /></span>
              <span className="mu">O que é isso: {b.oq}</span>
            </div>
          ))}
          {c.imagemPrompt ? (
            <div className="cd gap-1.5">
              <span className="kk">IMAGEM · PROMPT PRA GERAR</span>
              <span className="mu text-[13px] text-text-2">{c.imagemPrompt}</span>
              <CopyButton text={c.imagemPrompt} label="Copiar prompt" className="self-start" />
            </div>
          ) : null}
          {c.quiz && c.resultado ? <Quiz quiz={c.quiz} resultado={c.resultado} /> : null}
          {kit!.porQueFunciona ? <div className="cd"><span className="kk">POR QUE FUNCIONA</span><span className="tx text-[13px]">{kit!.porQueFunciona}</span></div> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <GerarButton pastaId={pasta.id} tipo="kit" label="Gerar de novo" className="b2" />
            <Link href={`/app/f02/${pasta.id}`} className="b2 no-underline">Trocar o funil</Link>
          </div>
          <div className="warn">Montar a página na {ferramenta} e a conferência automática (F05/F06) chegam quando o time definir a ferramenta e os modelos do SDM.</div>
          <Link href={`/app/dv01/${pasta.id}`} className="b1 no-underline">Próximo: divulgação</Link>
        </LangProvider>
      )}
    </div>
  );
}
