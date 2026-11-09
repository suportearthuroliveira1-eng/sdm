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
import { Icone } from "@/components/ui/icone";
import { PraQueServe } from "@/components/primeiro/pra-que-serve";

export const metadata: Metadata = { title: "Escolha seu caminho" };

// Tela 7 · 3 cartões grandes (textos editáveis no admin). Pode trocar ou somar depois no Perfil.


export default async function Caminho() {
  const [{ student }, fluxo, tx] = await Promise.all([requireStudent(), configFluxo(), textosApp()]);
  const OPCOES = CAMINHOS_PADRAO.map((o) => ({ ...o, ...(tx.caminhos[o.k] ?? {}) }));
  const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
  const sugerido = (d?.resultado as Resultado | null)?.caminho?.valor;
  const VIS = {
    afiliada: { icone: "megafone" as const, cor: "var(--c-sky)", chips: ["Mais rápido", "Não cria nada"] },
    produto: { icone: "livro" as const, cor: "var(--c-amber)", chips: ["Produto seu", "Mais passos"] },
    ambos: { icone: "passos" as const, cor: "var(--c-pink)", chips: ["Os dois", "2h+ por dia"] },
  } as const;
  const ordem = [...OPCOES].sort((x, y) => Number(y.k === sugerido) - Number(x.k === sugerido));
  return (
    <>
      <Passos atual={5} rotulo="Seu caminho" />
      <div className="surge flex flex-col gap-1">
        <h1 className="m-0 text-[26px] font-bold leading-tight">Escolha seu caminho</h1>
        <p className="m-0 text-[15px] text-text-2">Dá pra trocar ou somar depois.</p>
      </div>
      {ordem.map((o, i) => {
        const v = VIS[o.k as keyof typeof VIS];
        const sug = sugerido === o.k;
        return (
          <form key={o.k} action={escolherCaminho.bind(null, o.k)} className={`oc-revela flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-4 ${sug ? "border-accent bg-sel shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_25%,transparent)]" : "border-line bg-surface"}`} style={{ animationDelay: `${i * 160}ms` }}>
            <div className="flex items-center gap-3">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${sug ? "flutua" : ""}`} style={{ color: v.cor, background: `color-mix(in srgb, ${v.cor} 16%, transparent)` }}><Icone nome={v.icone} tamanho={24} /></span>
              <span className="flex flex-1 flex-col">
                {sug ? <span className="text-[10px] font-bold uppercase tracking-wider text-accent-2">Sugerido pra você</span> : null}
                <span className="text-[17px] font-bold leading-snug">{o.t}</span>
              </span>
            </div>
            <span className="text-[14px] leading-snug text-text-2">{o.o}</span>
            <div className="flex flex-wrap gap-1.5">
              {v.chips.map((c) => <span key={c} className="rounded-full bg-bg/60 px-2.5 py-1 text-[11px] font-bold text-text-2">{c}</span>)}
            </div>
            <PraQueServe rotulo="Ver detalhes">
              <span className="flex flex-col gap-1"><span><b>Tempo:</b> {o.tempo}</span><span><b>Dinheiro:</b> {o.dinheiro}</span><span><b>Pra quem:</b> {o.quem}</span></span>
            </PraQueServe>
            <SubmitButton className={sug ? "b1" : "b2"} pendente="Criando a sua pasta...">{sug ? "Escolher este" : "Escolher"}</SubmitButton>
          </form>
        );
      })}
      {fluxo.permitirDecidirDepois ? (
        <form action={escolherCaminho.bind(null, "depois")}>
          <SubmitButton className="b3" pendente="Salvando...">Decidir depois</SubmitButton>
        </form>
      ) : null}
    </>
  );
}
