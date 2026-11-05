import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/app/ui";
import { SubmitButton } from "@/components/ux/submit-button";
import { novaPasta } from "@/lib/actions/caminhos";
import { FASES } from "@/lib/domain/etapas";
import { minhasPastas, type PastaResumo } from "@/lib/server/pastas";

export const metadata: Metadata = { title: "Meus produtos" };

const GRUPOS: { tipo: PastaResumo["tipo"]; t: string }[] = [
  { tipo: "sdm", t: "SDM · AFILIADA" },
  { tipo: "proprio", t: "MEUS PRODUTOS" },
  { tipo: "vitrine", t: "AFILIADA DE PRODUTOS DA VITRINE" },
];

// Produtos (aba 2) · P1 Minhas pastas: cada produto é uma pasta com etapas, peças da IA e números.
export default async function V01() {
  const pastas = await minhasPastas();
  const temSdm = pastas.some((p) => p.tipo === "sdm");
  return (
    <>
      <PageTitle>Meus produtos</PageTitle>
      <div className="flex flex-col gap-5 lg:max-w-3xl">
        {pastas.length === 0 ? (
          <div className="cd items-center gap-2.5 border border-line px-[18px] py-[22px] text-center">
            <span className="text-lg font-bold">Você ainda não tem produto</span>
            <span className="tx text-muted">Cada produto que você vende ganha uma pasta: as etapas, tudo que a IA criou e os números. Nada se perde.</span>
          </div>
        ) : null}
        {GRUPOS.map((g) => {
          const lista = pastas.filter((p) => p.tipo === g.tipo);
          if (!lista.length) return null;
          return (
            <section key={g.tipo} className="flex flex-col gap-2" aria-label={g.t}>
              <span className="kk text-xs">{g.t}</span>
              {lista.map((p) => {
                const agora = p.etapas.find((e) => e.agora);
                const feitas = p.etapas.filter((e) => e.ok).length;
                const href = p.tipo === "vitrine" ? `/app/v05/${p.id}` : `/app/p/${p.id}`;
                return (
                  <Link key={p.id} href={href} className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4 text-text no-underline">
                    <span className="kk">{p.code}</span>
                    <span className="text-[17px] font-bold">{p.nome}</span>
                    <span className="mu">{FASES[p.fase]}{p.etapas.length ? ` · ${feitas} de ${p.etapas.length} etapas` : ""}</span>
                    {agora ? <span className="text-[13px] font-semibold text-accent-2">Agora: {agora.nome}</span> : null}
                    {p.etapas.length ? (
                      <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-line"><div className="rounded-[3px] bg-accent" style={{ width: `${(feitas / p.etapas.length) * 100}%` }} /></div>
                    ) : null}
                  </Link>
                );
              })}
            </section>
          );
        })}
        <div className="grid gap-2 sm:grid-cols-2">
          <form action={novaPasta.bind(null, "proprio")}>
            <SubmitButton pendente="Criando a pasta...">+ Criar produto com a IA</SubmitButton>
          </form>
          {temSdm ? null : (
            <form action={novaPasta.bind(null, "sdm")}>
              <SubmitButton className="b2 w-full" pendente="Criando a pasta...">Quero ser afiliada do SDM</SubmitButton>
            </form>
          )}
        </div>
        <Link href="/app/v02" className="b3 self-start">Ver a vitrine de outros produtos</Link>
      </div>
    </>
  );
}
