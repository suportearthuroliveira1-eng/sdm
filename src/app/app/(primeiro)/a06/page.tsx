import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Passos } from "@/components/app/passos";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Resultado } from "@/lib/domain/diagnostico";
import { paises } from "@/lib/server/pasta";
import { INFO_MERCADO } from "@/lib/domain/mercados";
import { Robo } from "@/components/ux/ia-trabalhando";
import { CartaoPorque, PraQueServe } from "@/components/primeiro/pra-que-serve";

export const metadata: Metadata = { title: "O que a IA entendeu" };

const CAMINHO = { afiliada: "Ser afiliada do SDM", produto: "Criar o seu produto com a IA", ambos: "Os dois caminhos" } as const;
const DIV = { pago: "Anúncio pago", org: "Vídeo orgânico (sem pagar)", ambos: "Anúncio e vídeo orgânico" } as const;

// Tela 6 · resumo simples + sugestões. Ela confere antes de a IA usar.
export default async function A06() {
  const { student } = await requireStudent();
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const r = d?.resultado as Resultado | null;
  if (!r) redirect("/app/a05");
  const info = (INFO_MERCADO as Record<string, { nome: string; idioma: string } | undefined>)[r.pais_venda.k];
  const pais = info ? `${info.nome} · ${info.idioma.toLowerCase()}` : ((await paises()).find((p) => p.k === r.pais_venda.k)?.nome ?? r.pais_venda.k);
  return (
    <>
      <Passos atual={4} rotulo="Resultado" />
      <section className="surge flex items-start gap-3">
        <span className="shrink-0"><Robo tamanho={72} /></span>
        <div className="relative mt-1 flex-1 rounded-2xl rounded-tl-sm border border-accent/40 bg-sel p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-2">A IA entendeu</span>
          <p className="m-0 text-[14px] leading-snug text-text">{r.perfil}</p>
        </div>
      </section>
      <h1 className="m-0 text-[22px] font-bold leading-tight">Por onde começar</h1>
      <div className="flex flex-col gap-2.5">
        <CartaoPorque icone="passos" cor="var(--accent)" rotulo="Seu caminho" valor={CAMINHO[r.caminho.valor]} porque={r.caminho.porque} destaque atraso={150} />
        <CartaoPorque icone="globo" cor="var(--c-sky)" rotulo="Vender pra" valor={pais} porque={`${r.pais_venda.porque} Dá pra trocar depois.`} atraso={400} />
        <CartaoPorque icone="megafone" cor="var(--c-pink)" rotulo="Divulgar com" valor={DIV[r.divulgacao.valor]} porque={r.divulgacao.porque} atraso={650} />
      </div>
      {r.cuidados.length ? (
        <PraQueServe rotulo={`Pra ficar de olho (${r.cuidados.length})`}>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">{r.cuidados.map((c) => <li key={c}>• {c}</li>)}</ul>
        </PraQueServe>
      ) : null}
      <div className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 bg-bg/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur">
        <Link href="/app/caminho" className="b1 no-underline">Está certo</Link>
        <Link href="/app/a05?q=0" className="b3 no-underline">Corrigir uma resposta</Link>
      </div>
    </>
  );
}
