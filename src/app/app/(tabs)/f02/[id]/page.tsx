import type { Metadata } from "next";
import { PastaHead } from "@/components/pasta/head";
import { escolherFunil } from "@/lib/actions/pasta";
import { getPasta } from "@/lib/server/pasta";

export const metadata: Metadata = { title: "Escolher o funil" };

// Textos do protótipo (FUN).
const FUN = {
  pre: { nome: "Pré-venda", d: "Uma página curta sua que aquece a pessoa antes da página do produtor.", quando: "Bom pra anúncio e pra produto que precisa de um pouco de explicação.", pros: "aquece o cliente e o pixel aprende mais", contras: "você monta uma página (com o modelo pronto)", monta: "O app escreve o texto, bloco por bloco. Você cola num modelo pronto, o app confere e você testa." },
  quiz: { nome: "Quiz", d: "Três perguntas rápidas que fazem a pessoa pensar no problema dela antes da página do produtor.", quando: "Bom quando o público gosta de se descobrir e pra vídeo orgânico.", pros: "a pessoa participa e chega mais interessada", contras: "você monta um quiz (com o modelo pronto)", monta: "O app escreve as perguntas e o resultado. Você cola num modelo pronto, o app confere e você testa." },
  direto: { nome: "Direto", d: "O anúncio ou o link da bio vai direto pra página do produtor, pelo seu link de afiliada.", quando: "Bom pra começar rápido e pra produto que já se explica sozinho.", pros: "nada pra montar, você só testa o link", contras: "você não aquece o cliente antes", monta: "Você não monta página. O app prepara os anúncios e os roteiros, e você testa o caminho até o checkout." },
} as const;

// F01 + F02 · O caminho até a compra e a escolha do funil (protótipo).
export default async function F02({ params }: PageProps<"/app/f02/[id]">) {
  const { id } = await params;
  const { pasta, vit } = await getPasta(id);
  const indicado = vit?.funilIndicado ?? "pre";
  return (
    <div className="flex flex-col gap-3.5 lg:max-w-3xl">
      <PastaHead id={pasta.id} code={pasta.code} produto={vit?.nome ?? ""} k="ETAPA 2" t="O caminho até a compra" />
      <p className="tx">Funil é o caminho que a pessoa faz do anúncio ou do vídeo até pagar. A página de vendas e o checkout já existem: são do produtor. Você só leva gente até lá. São 3 jeitos; o indicado pro {vit?.nome} está marcado.</p>
      <div className="grid gap-3 lg:grid-cols-3">
        {(Object.keys(FUN) as (keyof typeof FUN)[]).map((k) => {
          const f = FUN[k];
          const sel = pasta.funil === k;
          return (
            <form key={k} action={escolherFunil.bind(null, pasta.id, k)} className={`flex flex-col gap-2 rounded-[14px] border-[1.5px] p-3.5 ${sel ? "border-accent bg-sel" : "border-line bg-surface"}`}>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-base font-bold">{f.nome}</span>
                {k === indicado ? <span className="rounded-[10px] bg-accent px-2 py-1 text-[11px] font-bold text-accent-ink">INDICADO</span> : null}
              </div>
              <span className="tx text-[13px]">{f.d}</span>
              <span className="kk mt-1">QUANDO USAR</span>
              <span className="tx text-[13px]">{f.quando}</span>
              <span className="text-xs text-ok">+ {f.pros}</span>
              <span className="text-xs text-warn">− {f.contras}</span>
              <span className="kk mt-1">O QUE VOCÊ VAI FAZER</span>
              <span className="tx text-[13px]">{f.monta}</span>
              <button className={`${sel ? "b2" : "b1"} mt-auto min-h-[46px] text-sm`}>{sel ? `Usando ${f.nome} · gerar de novo` : `Usar ${f.nome}`}</button>
            </form>
          );
        })}
      </div>
      <div className="warn">Nada vai pro ar sem você aprovar.</div>
    </div>
  );
}
