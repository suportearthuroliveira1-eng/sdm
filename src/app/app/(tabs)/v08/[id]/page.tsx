import type { Metadata } from "next";
import { PastaHead } from "@/components/pasta/head";
import { getPasta } from "@/lib/server/pasta";
import type { LinkTeste } from "@/lib/actions/pasta";
import { LinkForm } from "./link-form";

export const metadata: Metadata = { title: "Link de afiliada" };

// V08 · Link de afiliada com teste real (servidor abre o link, segue redirecionamentos, confere domínio).
export default async function V08({ params }: PageProps<"/app/v08/[id]">) {
  const { id } = await params;
  const { pasta, vit } = await getPasta(id);
  return (
    <div className="flex flex-col gap-3.5 lg:max-w-2xl">
      <PastaHead id={pasta.id} code={pasta.code} produto={vit?.nome ?? ""} k="ETAPA 1" t="Seu link de afiliada" />
      <p className="tx">O link de afiliada é o que marca que a venda veio de você. Você pega na rede de afiliação, na página do {vit?.nome}.</p>
      <LinkForm id={pasta.id} valor={pasta.linkAfiliada ?? ""} ultimo={(pasta.linkTeste as LinkTeste | null) ?? null} produto={vit?.nome ?? ""} />
    </div>
  );
}
