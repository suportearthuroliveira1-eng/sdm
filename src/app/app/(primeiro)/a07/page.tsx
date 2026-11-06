import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { SubmitButton } from "@/components/ux/submit-button";
import { combinar } from "@/lib/actions/onboarding";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { configFluxo, textosApp } from "@/lib/server/config-app";
import { SDM_FAZ, VOCE_FAZ } from "@/lib/domain/textos-padrao";

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
      <span className="self-start rounded-[10px] bg-warn-bg px-2.5 py-1 text-xs font-bold tracking-[0.5px] text-warn">AULA 0.6</span>
      <h1 className="m-0 text-[26px] font-bold leading-tight">{tx.combinado.titulo || "O nosso combinado"}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {[["O QUE O SDM FAZ", sdmFaz], ["O QUE VOCÊ FAZ", voceFaz]].map(([t, l]) => (
          <div key={t as string} className="cd gap-2">
            <span className="kk">{t as string}</span>
            {(l as string[]).map((x, i) => (
              <div key={x} className="flex gap-2.5">
                <span className="dot bg-sel text-accent-2" aria-hidden>{i + 1}</span>
                <span className="tx">{x}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="mu">O SDM não promete ganho: ele te ensina o caminho e te acompanha. O resultado vem do seu passo por dia.</p>
      {student.combinadoEm ? <div className="good">Combinado feito em {student.combinadoEm.toLocaleDateString("pt-BR")}.</div> : null}
      <form action={combinar} className="mt-auto">
        <SubmitButton pendente="Registrando...">{student.combinadoEm ? "Seguir" : "Combinado"}</SubmitButton>
      </form>
    </>
  );
}
