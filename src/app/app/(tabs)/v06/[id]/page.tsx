import type { Metadata } from "next";
import Link from "next/link";
import { PastaHead } from "@/components/pasta/head";
import { getPasta } from "@/lib/server/pasta";
import { CartaoForm } from "./cartao-form";

export const metadata: Metadata = { title: "Ficha do produto" };

// V06 · Ficha que se preenche sozinha (protótipo). Toda geração lê daqui.
export default async function V06({ params }: PageProps<"/app/v06/[id]">) {
  const { id } = await params;
  const { pasta, vit } = await getPasta(id);
  const lt = pasta.linkTeste as { ok?: boolean; dominio?: string } | null;
  const ficha: [string, string][] = [
    ["Produto", vit?.nome ?? "—"],
    ["Tipo", vit?.tipo ?? "—"],
    ["Assunto", vit?.assunto ?? "—"],
    ["Pra quem", vit?.publico ?? "—"],
    ["Dor", vit?.dor ?? "—"],
    ["O que é", vit?.oQueE ?? "—"],
    ["Promessa", vit?.promessa ?? "—"],
    ["País de venda", pasta.paisVenda ? pasta.paisVenda.toUpperCase() : "a escolher"],
    ["Link de afiliada", pasta.linkAfiliada ? `${pasta.linkAfiliada}${lt?.ok ? " (testado)" : " (não testado)"}` : "—"],
    ["Funil", pasta.funil ?? "a escolher"],
    ["Comissão", vit?.comissaoValor ?? "[valor]"],
  ];
  return (
    <div className="flex flex-col gap-3.5 lg:max-w-3xl">
      <PastaHead id={pasta.id} code={pasta.code} produto={vit?.nome ?? ""} k="FICHA DO PRODUTO" t="O que a IA sabe desse produto" />
      <p className="tx text-[13px]">Se preenche sozinha com o que você escolhe e faz. Toda geração do app lê daqui.</p>
      <dl className="m-0 flex flex-col rounded-2xl border border-line bg-surface">
        {ficha.map(([l, v]) => (
          <div key={l} className="flex gap-2.5 border-b border-line-3 px-3.5 py-[11px] last:border-0">
            <dt className="w-[110px] flex-none text-xs font-semibold text-muted">{l}</dt>
            <dd className="m-0 flex-1 break-words text-[13px] leading-snug">{v}</dd>
          </div>
        ))}
      </dl>
      <CartaoForm id={pasta.id} valor={pasta.cartaoAjudaQuem ?? ""} />
      <Link href={`/app/v07/${pasta.id}`} className="b2 no-underline lg:max-w-xs">Trocar o país de venda</Link>
    </div>
  );
}
