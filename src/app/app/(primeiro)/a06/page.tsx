import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Passos } from "@/components/app/passos";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Resultado } from "@/lib/domain/diagnostico";
import { paises } from "@/lib/server/pasta";

export const metadata: Metadata = { title: "O que a IA entendeu" };

const CAMINHO = { afiliada: "Ser afiliada do SDM", produto: "Criar o seu produto com a IA", ambos: "Os dois caminhos" } as const;
const DIV = { pago: "Anúncio pago", org: "Vídeo orgânico", ambos: "Anúncio pago e vídeo orgânico" } as const;

// Tela 6 · resumo simples + sugestões. Ela confere antes de a IA usar.
export default async function A06() {
  const { student } = await requireStudent();
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const r = d?.resultado as Resultado | null;
  if (!r) redirect("/app/a05");
  const pais = (await paises()).find((p) => p.k === r.pais_venda.k);
  return (
    <>
      <Passos atual={4} rotulo="O que a IA entendeu" />
      <h1 className="m-0 text-[26px] font-bold leading-tight">O que a IA entendeu</h1>
      <p className="tx">Confira com calma. Tudo pode ser mudado depois, no Perfil.</p>
      <div className="cd gap-1.5"><span className="kk">QUEM É VOCÊ</span><span className="tx">{r.perfil}</span></div>
      <div className="cd gap-1.5"><span className="kk">PAÍS E IDIOMA DE VENDA SUGERIDOS</span><span className="text-[15px] font-bold">{pais?.nome ?? r.pais_venda.k}</span><span className="mu">{r.pais_venda.porque}</span></div>
      <div className="cd gap-1.5 border border-accent bg-sel"><span className="kk">O CAMINHO QUE PARECE COMBINAR</span><span className="text-[15px] font-bold">{CAMINHO[r.caminho.valor]}</span><span className="mu text-text-2">{r.caminho.porque} A decisão é sua, no próximo passo.</span></div>
      <div className="cd gap-1.5"><span className="kk">COMO DIVULGAR</span><span className="text-[15px] font-bold">{DIV[r.divulgacao.valor]}</span><span className="mu">{r.divulgacao.porque}</span></div>
      {r.cuidados.length ? (
        <div className="cd gap-1.5"><span className="kk">PRA FICAR DE OLHO</span>{r.cuidados.map((c) => <span key={c} className="tx">• {c}</span>)}</div>
      ) : null}
      <span className="mu">{r.motor === "regras" ? "Resumo feito pelas regras do app (a IA estava fora do ar)." : "Resumo feito pela IA a partir das suas respostas."}</span>
      <div className="mt-auto flex flex-col gap-2">
        <Link href="/app/caminho" className="b1 no-underline">Está certo</Link>
        <Link href="/app/a05?q=0" className="b2 no-underline">Corrigir uma resposta</Link>
      </div>
    </>
  );
}
