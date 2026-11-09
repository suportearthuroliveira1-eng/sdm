import type { Metadata } from "next";
import { Passos } from "@/components/app/passos";
import { SubmitButton } from "@/components/ux/submit-button";
import { boasVindas } from "@/lib/actions/onboarding";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { depoisDe } from "@/lib/domain/onboarding";
import { configFluxo, textosApp } from "@/lib/server/config-app";
import { marcaApp } from "@/lib/server/marca";
import { Icone } from "@/components/ui/icone";
import { Robo } from "@/components/ux/ia-trabalhando";
import { PraQueServe } from "@/components/primeiro/pra-que-serve";

export const metadata: Metadata = { title: "Boas-vindas" };

// Tela 3 do fluxo ideal / A04 do protótipo: o primeiro contato é com a Amanda, não com formulário.
export default async function A04() {
  const [{ student }, fluxo, tx, marca] = await Promise.all([requireStudent(), configFluxo(), textosApp(), marcaApp()]);
  if (fluxo.pularBoasVindas) redirect(depoisDe("a04", fluxo));
  const bv = tx.boasVindas;
  const nome = student.nome.split(/\s+/)[0] ?? "";
  const nomeAmanda = marca.nomeAmanda ?? "Amanda Gomes";
  return (
    <>
      <Passos atual={1} rotulo="Boas-vindas" />
      <section className="surge flex flex-col items-center gap-3 pt-2 text-center">
        <div className="relative">
          <span aria-hidden className="absolute -inset-3 rounded-full bg-accent/25 blur-xl" />
          {marca.fotoAmanda ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={marca.fotoAmanda} alt={nomeAmanda} className="flutua relative size-24 rounded-full border-[3px] border-accent object-cover" />
          ) : (
            <span className="flutua relative block"><Robo tamanho={110} /></span>
          )}
        </div>
        <h1 className="m-0 text-[28px] font-bold leading-tight">{bv.titulo ? bv.titulo.replace("{nome}", nome) : `Oi, ${nome}!`}</h1>
        <p className="m-0 max-w-xs text-[15px] text-text-2">{bv.texto || `Eu sou a ${nomeAmanda.split(" ")[0]}. Aqui você aprende a vender pela internet, um passo por dia.`}</p>
      </section>
      {bv.videoUrl ? (
        <div className="surge overflow-hidden rounded-[18px] border border-line bg-surface-2" style={{ animationDelay: "120ms" }}>
          <video src={bv.videoUrl} controls playsInline preload="metadata" className="aspect-video w-full" />
        </div>
      ) : (
        <form action={boasVindas.bind(null, "l02")} className="surge" style={{ animationDelay: "120ms" }}>
          <button className="press flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left text-text">
            <span className="pulsa grid size-12 shrink-0 place-items-center rounded-full bg-accent" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#140F1F"><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span className="flex flex-col"><span className="text-sm font-bold">Aula de boas-vindas</span><span className="mu text-xs">2 minutos · recado da {nomeAmanda.split(" ")[0]}</span></span>
          </button>
        </form>
      )}
      <section aria-label="O que você vai fazer aqui" className="flex flex-col gap-2">
        <span className="kk">SEU CAMINHO AQUI</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: "Aprender", d: "sem palavra difícil", icone: "play" as const, cor: "var(--c-sky)" },
            { t: "Escolher", d: "seu caminho", icone: "passos" as const, cor: "var(--c-amber)" },
            { t: "Vender", d: "e ver os números", icone: "grafico" as const, cor: "var(--ok)" },
          ].map((x, i) => (
            <div key={x.t} className="oc-revela flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface px-2 py-3 text-center" style={{ animationDelay: `${250 + i * 150}ms` }}>
              <span className="oc-selo grid size-11 place-items-center rounded-2xl" style={{ color: x.cor, background: `color-mix(in srgb, ${x.cor} 16%, transparent)`, animationDelay: `${350 + i * 150}ms` }}><Icone nome={x.icone} tamanho={22} /></span>
              <span className="text-sm font-bold">{i + 1}. {x.t}</span>
              <span className="text-[11px] leading-tight text-muted">{x.d}</span>
            </div>
          ))}
        </div>
      </section>
      <PraQueServe rotulo="Como funciona o app?">Primeiro você responde umas perguntas rápidas. A IA entende o seu jeito e sugere por onde começar. Depois, o app mostra sempre um próximo passo só.</PraQueServe>
      <form action={boasVindas.bind(null, "a07")} className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 bg-bg/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur">
        <SubmitButton pendente="Abrindo...">Vamos começar</SubmitButton>
      </form>
    </>
  );
}
