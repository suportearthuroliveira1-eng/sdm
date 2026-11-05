import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { SubmitButton } from "@/components/ux/submit-button";
import { combinar } from "@/lib/actions/onboarding";
import { requireStudent } from "@/lib/auth/session";

export const metadata: Metadata = { title: "O nosso combinado" };

// Tela 4 · duas colunas: o que o SDM faz e o que ela faz. Nada de promessa de ganho.
const SDM_FAZ = [
  "Explica cada passo antes de pedir, em aula curta.",
  "A IA escreve no idioma do cliente e mostra o português do lado.",
  "O app mostra sempre um próximo passo só.",
  "O time responde quando você travar.",
];
const VOCE_FAZ = [
  "Eu vou dar um passo por dia, mesmo que pequeno.",
  'Eu vou fazer o "Agora faça" de cada aula antes de seguir.',
  "Eu vou perguntar quando travar, em vez de sumir.",
  "Eu vou até o fim do meu caminho.",
];

export default async function A07() {
  const { student } = await requireStudent();
  return (
    <>
      <Passos atual={2} rotulo="Combinado" />
      <span className="self-start rounded-[10px] bg-warn-bg px-2.5 py-1 text-xs font-bold tracking-[0.5px] text-warn">AULA 0.6</span>
      <h1 className="m-0 text-[26px] font-bold leading-tight">O nosso combinado</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {[["O QUE O SDM FAZ", SDM_FAZ], ["O QUE VOCÊ FAZ", VOCE_FAZ]].map(([t, l]) => (
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
