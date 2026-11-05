import type { Metadata } from "next";
import { PastaHead } from "@/components/pasta/head";
import { escolherPais } from "@/lib/actions/pasta";
import { FormPending } from "@/components/ux/submit-button";
import { getPasta, itensDaPasta, paises } from "@/lib/server/pasta";

export const metadata: Metadata = { title: "País e idioma" };

// V07 · País e idioma de venda (protótipo). Sugestão: países que falam o idioma do produto.
export default async function V07({ params }: PageProps<"/app/v07/[id]">) {
  const { id } = await params;
  const { pasta, vit } = await getPasta(id);
  const [lista, itens] = await Promise.all([paises(), itensDaPasta(pasta.id)]);
  const lang = (vit?.extra as { lang?: string } | null)?.lang ?? vit?.idioma ?? "en";
  return (
    <div className="flex flex-col gap-3.5 lg:max-w-3xl">
      <PastaHead id={pasta.id} code={pasta.code} produto={vit?.nome ?? ""} k="ETAPA 0" t="Pra quem você vai vender?" />
      <p className="tx">País e idioma de venda são de quem compra, não seus. Tudo que o app gera sai nesse idioma, sempre com tradução pra você.</p>
      <div className="grid gap-2.5 lg:grid-cols-2">
        {lista.map((p) => {
          const sel = pasta.paisVenda === p.k;
          const reco = p.lang === lang;
          return (
            <form key={p.k} action={escolherPais.bind(null, pasta.id, p.k)}>
              <button className={`press flex w-full cursor-pointer flex-col items-start gap-1.5 rounded-[14px] border-[1.5px] p-3.5 text-left text-text ${sel ? "border-accent bg-sel" : "border-line bg-surface hover:border-line-2"} ${!reco ? "opacity-70" : ""}`}>
                <span className="flex w-full items-center gap-2">
                  <span className="flex-1 text-base font-bold">{p.nome}</span>
                  {sel ? <span className="rounded-[10px] bg-accent px-2 py-1 text-[11px] font-bold text-accent-ink">ESCOLHIDO</span> : reco ? <span className="rounded-[10px] bg-sel px-2 py-1 text-[11px] font-bold text-accent-2">SUGERIDO</span> : null}
                </span>
                <span className="tx text-[13px]">{reco ? `O ${vit?.nome} é em ${p.idioma.toLowerCase()}: combina com esse público.` : `O ${vit?.nome} não é em ${p.idioma.toLowerCase()}.`}</span>
                <span className="mu">Recebe em {p.moeda} · tudo sai em {p.idioma.toLowerCase()}</span>
                <FormPending label="Confirmando o país..." />
              </button>
            </form>
          );
        })}
      </div>
      {pasta.paisConfirmado && itens.length ? <div className="warn">Trocar o país muda o idioma. Seu kit e seus criativos ficam marcados pra refazer no idioma novo.</div> : null}
    </div>
  );
}
