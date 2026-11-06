import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { SubmitButton } from "@/components/ux/submit-button";
import { boasVindas } from "@/lib/actions/onboarding";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { depoisDe } from "@/lib/domain/onboarding";
import { configFluxo, textosApp } from "@/lib/server/config-app";

export const metadata: Metadata = { title: "Boas-vindas" };

// Tela 3 do fluxo ideal / A04 do protótipo: o primeiro contato é com a Amanda, não com formulário.
export default async function A04() {
  const [{ student }, fluxo, tx] = await Promise.all([requireStudent(), configFluxo(), textosApp()]);
  if (fluxo.pularBoasVindas) redirect(depoisDe("a04", fluxo));
  const bv = tx.boasVindas;
  const nome = student.nome.split(/\s+/)[0] ?? "";
  return (
    <>
      <Passos atual={1} rotulo="Boas-vindas" />
      <h1 className="m-0 text-[26px] font-bold leading-tight">{bv.titulo ? bv.titulo.replace("{nome}", nome) : `Que bom que você chegou, ${nome}`}</h1>
      <p className="tx text-muted">{bv.texto || "Antes de tudo, um recado da Amanda pra você."}</p>
      {bv.videoUrl ? (
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface-2">
          <video src={bv.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full" />
        </div>
      ) : (
      <form action={boasVindas.bind(null, "l02")}>
        <button className="press flex min-h-[190px] w-full flex-col items-center justify-center gap-2.5 rounded-[18px] border border-line bg-surface-2 text-text">
          <span className="flex size-[60px] items-center justify-center rounded-full bg-accent" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#140F1F"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className="text-sm font-semibold">Aula 0.1 · Bem-vinda: você chegou no lugar certo</span>
        </button>
      </form>
      )}
      <div className="cd gap-2.5">
        <span className="text-sm font-bold">O que você vai fazer aqui</span>
        <span className="tx">1. Entender o que é vender pela internet, sem palavra difícil</span>
        <span className="tx">2. Escolher o seu caminho: ser afiliada do SDM, criar o seu produto com a IA, ou os dois</span>
        <span className="tx">3. Divulgar, pago ou orgânico, e acompanhar os seus números</span>
      </div>
      <p className="tx italic text-muted">&quot;Você não precisa ser expert. Precisa dar um passo por dia, com verdade, e colocar Deus na frente.&quot;</p>
      <form action={boasVindas.bind(null, "a07")} className="mt-auto flex flex-col gap-2">
        <SubmitButton pendente="Abrindo...">Começar</SubmitButton>
      </form>
    </>
  );
}
