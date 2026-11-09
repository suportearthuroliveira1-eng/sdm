import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { SubmitButton } from "@/components/ux/submit-button";
import { combinar } from "@/lib/actions/onboarding";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { configFluxo, textosApp } from "@/lib/server/config-app";
import { SDM_FAZ, VOCE_FAZ } from "@/lib/domain/textos-padrao";
import { Icone } from "@/components/ui/icone";
import { PraQueServe } from "@/components/primeiro/pra-que-serve";

export const metadata: Metadata = { title: "O nosso combinado" };

// Tela 4 · duas colunas: o que o SDM faz e o que ela faz. Nada de promessa de ganho.


export default async function A07() {
  const [{ student }, fluxo, tx] = await Promise.all([requireStudent(), configFluxo(), textosApp()]);
  if (fluxo.pularCombinado) redirect("/app/a05");
  const sdmFaz = tx.combinado.sdmFaz?.length ? tx.combinado.sdmFaz : SDM_FAZ;
  const voceFaz = tx.combinado.voceFaz?.length ? tx.combinado.voceFaz : VOCE_FAZ;
  return (
    <>
      <Passos atual={2} rotulo="Combinado" />
      <div className="surge flex flex-col gap-1.5">
        <h1 className="m-0 text-[26px] font-bold leading-tight">{tx.combinado.titulo || "O nosso combinado"}</h1>
        <p className="m-0 text-[15px] text-text-2">A gente faz a parte da gente. Você faz a sua.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { t: "O SDM faz", l: sdmFaz, icone: "kit" as const, cor: "var(--accent)" },
          { t: "Você faz", l: voceFaz, icone: "pessoa" as const, cor: "var(--c-amber)" },
        ].map((col, c) => (
          <section key={col.t} aria-label={col.t} className="oc-revela flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4" style={{ animationDelay: `${c * 200}ms` }}>
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: col.cor }}><Icone nome={col.icone} tamanho={18} /> {col.t}</span>
            {col.l.map((x, i) => (
              <div key={x} className="oc-revela flex items-start gap-2.5" style={{ animationDelay: `${c * 200 + 150 + i * 110}ms` }}>
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-accent-ink" style={{ background: col.cor }}><Icone nome="check" tamanho={12} espessura={3} /></span>
                <span className="text-[14px] leading-snug text-text">{x}</span>
              </div>
            ))}
          </section>
        ))}
      </div>
      <PraQueServe>O SDM não promete ganho. Ele te ensina o caminho e te acompanha. O resultado vem do seu passo por dia.</PraQueServe>
      {student.combinadoEm ? <div className="good">Combinado feito em {student.combinadoEm.toLocaleDateString("pt-BR")}.</div> : null}
      <form action={combinar} className="sticky bottom-0 -mx-5 mt-auto bg-bg/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur">
        <SubmitButton pendente="Registrando...">{student.combinadoEm ? "Seguir" : "Combinado"}</SubmitButton>
      </form>
    </>
  );
}
