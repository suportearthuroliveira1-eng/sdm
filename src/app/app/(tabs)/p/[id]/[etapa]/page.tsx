import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EtapaHead, NavEtapas } from "@/components/etapas/comum";
import { BaseAnuncios, Divulgar, Numeros, Perfil, Pixel } from "@/components/etapas/divulgacao";
import { Ebook } from "@/components/etapas/ebook";
import { ProprioEntenda, ProprioFicha, ProprioIdeias, ProprioMercado, ProprioOferta, ProprioPagina, ProprioPlataforma, ProprioRevisao, ProprioTeste } from "@/components/etapas/proprio";
import { Conta, SdmAfiliacao, SdmEntenda, SdmKit, SdmLink, SdmRegras } from "@/components/etapas/sdm";
import { db, schema } from "@/lib/db";
import type { CapEbook } from "@/lib/domain/temas";
import { hrefEtapa, pastaDaAluna } from "@/lib/server/pastas";
import { marcarOndeParou } from "@/lib/server/onde-parou";

export const metadata: Metadata = { title: "Etapa" };

// Etapas das pastas (fluxo ideal): cada uma abre com "Entenda" e a aula, depois a ferramenta.
export default async function Etapa({ params, searchParams }: PageProps<"/app/p/[id]/[etapa]">) {
  const { id, etapa: slug } = await params;
  const parte = String((await searchParams).parte ?? "");
  if (slug === "criativos" || slug === "roteiros") redirect(`/app/dv01/${id}?aba=${slug === "roteiros" ? "roteiros" : "anuncios"}`);
  const ctx = await pastaDaAluna(id);
  if (!ctx) notFound();
  const { pasta, etapas } = ctx;
  const i = etapas.findIndex((e) => e.slug === slug);
  const et = etapas[i];
  if (!et) notFound();
  if (et.travada) {
    return (
      <div className="flex flex-col gap-3 lg:max-w-3xl">
        <EtapaHead pastaId={pasta.id} pastaNome={pasta.nome ?? ""} etapa={et} etapas={etapas} tipo={pasta.tipo} oculto={((pasta.dados ?? {}) as { oculto?: { nome?: string } }).oculto?.nome ?? null} />
        <div className="warn">Essa etapa ainda está fechada. {et.travada}</div>
        {(() => {
          const agora = etapas.find((e) => e.agora);
          return agora ? <Link href={hrefEtapa(pasta.id, agora.slug)} className="b1 no-underline">Ir pro passo de agora: {agora.nome}</Link> : <Link href={`/app/p/${pasta.id}`} className="b1 no-underline">Ver o que falta</Link>;
        })()}
      </div>
    );
  }
  await marcarOndeParou(pasta.studentId, { path: hrefEtapa(pasta.id, slug), titulo: `${pasta.nome ?? "Pasta"}: ${et.nome}`, tipo: "etapa" });
  // a próxima na ordem (destrava quando esta ficar pronta)
  const prox = etapas[i + 1];
  const proxima = prox ? hrefEtapa(pasta.id, prox.slug) : `/app/p/${pasta.id}`;
  const p = { id: pasta.id, dados: (pasta.dados ?? {}) as Record<string, unknown>, studentId: pasta.studentId, paisVenda: pasta.paisVenda, divulgacao: pasta.divulgacao, bioCode: pasta.bioCode };

  let corpo: React.ReactNode = null;
  if (pasta.tipo === "sdm") {
    if (slug === "entenda") corpo = <SdmEntenda p={p} proxima={proxima} />;
    if (slug === "afiliacao") corpo = <SdmAfiliacao p={p} proxima={proxima} />;
    if (slug === "link") corpo = <SdmLink p={p} proxima={proxima} />;
    if (slug === "kit") corpo = <SdmKit p={p} proxima={proxima} />;
    if (slug === "regras") corpo = <SdmRegras p={p} proxima={proxima} />;
  } else {
    if (slug === "entenda") corpo = <ProprioEntenda p={p} proxima={proxima} />;
    if (slug === "ideias") corpo = <ProprioIdeias p={p} />;
    if (slug === "ficha") corpo = <ProprioFicha p={p} proxima={proxima} />;
    if (slug === "oferta") corpo = <ProprioOferta p={p} proxima={proxima} />;
    if (slug === "mercado") corpo = <ProprioMercado p={p} proxima={proxima} />;
    if (slug === "revisao") corpo = <ProprioRevisao p={p} proxima={proxima} />;
    if (slug === "pagina") corpo = <ProprioPagina p={p} proxima={proxima} />;
    if (slug === "plataforma") corpo = <ProprioPlataforma p={p} proxima={proxima} />;
    if (slug === "teste") corpo = <ProprioTeste p={p} proxima={proxima} />;
    if (slug === "ebook") {
      const eb = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, pasta.id), eq(schema.ebooks.studentId, pasta.studentId)) });
      const ideia = (eb?.ideia ?? {}) as { titulo?: { x: string }; subtitulo?: { x: string }; sumarioAprovado?: boolean; extras?: unknown };
      corpo = (
        <Ebook
          pastaId={pasta.id}
          proxima={proxima}
          eb={eb ? { capitulos: (eb.capitulos ?? []) as CapEbook[], aprovado: Boolean(ideia.sumarioAprovado), tema: eb.temaVisual ?? "lilas", tom: eb.tom ?? "amiga", tamanho: eb.tamanho ?? 10, titulo: ideia.titulo?.x ?? eb.titulo ?? "", subtitulo: ideia.subtitulo?.x ?? "", idioma: eb.idioma ?? "en", temExtras: Boolean(ideia.extras) } : null}
        />
      );
    }
  }
  if (slug === "conta") corpo = <Conta p={p} proxima={proxima} />;
  if (slug === "divulgar") corpo = <Divulgar p={p} />;
  if (slug === "base-anuncios") corpo = <BaseAnuncios p={p} proxima={proxima} />;
  if (slug === "pixel") corpo = <Pixel p={p} proxima={proxima} />;
  if (slug === "perfil") corpo = <Perfil p={p} proxima={proxima} parte={parte || undefined} />;
  if (slug === "numeros") corpo = <Numeros p={p} org={false} />;
  if (slug === "numeros-org") corpo = <Numeros p={p} org />;

  return (
    <div className="flex flex-col gap-3.5 lg:max-w-4xl">
      <EtapaHead pastaId={pasta.id} pastaNome={pasta.nome ?? ""} etapa={et} etapas={etapas} tipo={pasta.tipo} oculto={((pasta.dados ?? {}) as { oculto?: { nome?: string } }).oculto?.nome ?? null} />
      {corpo}
      <NavEtapas pastaId={pasta.id} etapas={etapas} slug={slug} />
    </div>
  );
}
