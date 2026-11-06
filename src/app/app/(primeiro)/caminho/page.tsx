import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { SubmitButton } from "@/components/ux/submit-button";
import { escolherCaminho } from "@/lib/actions/onboarding";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import type { Resultado } from "@/lib/domain/diagnostico";
import { configFluxo, textosApp } from "@/lib/server/config-app";
import { CAMINHOS_PADRAO } from "@/lib/domain/textos-padrao";

export const metadata: Metadata = { title: "Escolha seu caminho" };

// Tela 7 · 3 cartões grandes (textos editáveis no admin). Pode trocar ou somar depois no Perfil.


export default async function Caminho() {
  const [{ student }, fluxo, tx] = await Promise.all([requireStudent(), configFluxo(), textosApp()]);
  const OPCOES = CAMINHOS_PADRAO.map((o) => ({ ...o, ...(tx.caminhos[o.k] ?? {}) }));
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const sugerido = (d?.resultado as Resultado | null)?.caminho?.valor;
  return (
    <>
      <Passos atual={5} rotulo="Seu caminho" />
      <h1 className="m-0 text-[26px] font-bold leading-tight">Escolha seu caminho</h1>
      <p className="tx text-muted">Dá pra trocar ou somar depois, no Perfil.</p>
      {OPCOES.map((o) => (
        <form key={o.k} action={escolherCaminho.bind(null, o.k)} className={`flex flex-col gap-2 rounded-2xl border-[1.5px] p-4 ${sugerido === o.k ? "border-accent bg-sel" : "border-line bg-surface"}`}>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-lg font-bold">{o.t}</span>
            {sugerido === o.k ? <span className="rounded-[10px] bg-accent px-2 py-1 text-[11px] font-bold text-accent-ink">SUGERIDO PRA VOCÊ</span> : null}
          </div>
          <span className="tx">{o.o}</span>
          <span className="mu"><b className="text-text-2">Tempo:</b> {o.tempo}</span>
          <span className="mu"><b className="text-text-2">Dinheiro:</b> {o.dinheiro}</span>
          <span className="mu"><b className="text-text-2">Pra quem:</b> {o.quem}</span>
          <SubmitButton className={sugerido === o.k ? "b1 mt-1" : "b2 mt-1"} pendente="Criando a sua pasta...">Escolher</SubmitButton>
        </form>
      ))}
      {fluxo.permitirDecidirDepois ? (
        <form action={escolherCaminho.bind(null, "depois")}>
          <SubmitButton className="b3" pendente="Salvando...">Decidir depois</SubmitButton>
        </form>
      ) : null}
    </>
  );
}
