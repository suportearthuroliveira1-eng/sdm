import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Item, PageTitle } from "@/components/app/ui";
import { FASES } from "@/lib/domain/etapas";
import { getJornada } from "@/lib/server/aluna";
import { minhasPastas } from "@/lib/server/pastas";
import { proximoPasso } from "@/lib/server/proximo";
import { configFluxo } from "@/lib/server/config-app";
import { passoPendente } from "@/lib/domain/onboarding";
import { ondeParouValido } from "@/lib/server/onde-parou";
import { Icone } from "@/components/ui/icone";
import { podeEntrarNoOculto } from "@/lib/server/pais-oculto";
import { requireStudent } from "@/lib/auth/session";
import { marcaApp } from "@/lib/server/marca";

export const metadata: Metadata = { title: "Início" };

// Início (aba 1) do fluxo ideal: I1 próximo passo, I2 meu caminho, I5 novidades.
export default async function Inicio() {
  const [j, pastas, fluxo, oculto, marca] = await Promise.all([getJornada(), minhasPastas(), configFluxo(), requireStudent().then(({ student }) => podeEntrarNoOculto(student.id)), marcaApp()]);
  if (!j.student.boasVindasEm && !fluxo.pularBoasVindas) redirect("/app/a04"); // primeira vez: boas-vindas
  const prox = proximoPasso(j, pastas, passoPendente(j.student, fluxo));
  const parou = ondeParouValido(j.student.ultimaTela, prox.href);
  // parou exatamente no próximo passo: o cartão vira "continue de onde parou"
  const continuar = !parou && (j.student.ultimaTela as { path?: string } | null)?.path === prox.href;
  const pilotoParado = pastas.find((p) => {
    const pil = (p.estado.dados as { piloto?: { em?: string; fim?: string | null } }).piloto;
    return p.tipo === "proprio" && pil?.em && !pil.fim && !p.estado.temEbookPronto;
  });
  const aulaExiste = prox.aula && j.modulos.some((m) => m.aulas.some((a) => a.id === prox.aula));
  const principal = prox.pasta ?? pastas.find((p) => p.tipo !== "vitrine");
  const pct = j.total ? Math.round((j.vistas / j.total) * 100) : 0;

  return (
    <>
      <PageTitle k={`Oi, ${j.student.nome.split(/\s+/)[0]}`}>Seu caminho</PageTitle>
      <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3.5">
          {oculto.pode ? (
            <Link href="/app/oculto" className="oc-convite surge flex items-center gap-3 rounded-2xl border border-c-amber/70 p-4 text-text no-underline" style={{ background: "linear-gradient(135deg, #1a1030, #0b0814)" }}>
              <span className="oc-fechadura grid size-12 shrink-0 place-items-center rounded-2xl bg-[#c9a227] text-[#2a1a0e]"><Icone nome="globo" tamanho={24} /></span>
              <span className="flex flex-1 flex-col">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-c-amber">Liberado só pra você</span>
                <span className="oc-titulo text-[18px] font-extrabold leading-snug">País Oculto</span>
                <span className="text-xs text-text-2">{oculto.cfg.convite || "Mercados escondidos e uma estratégia secreta, feita pela IA pra você."}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-c-amber">Abrir →</span>
            </Link>
          ) : null}
          {pilotoParado ? (
            <Link href={`/app/p/${pilotoParado.id}`} className="surge flex items-center gap-3 rounded-2xl border border-c-amber/60 bg-[color-mix(in_srgb,var(--c-amber)_10%,var(--surface))] p-4 text-text no-underline">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-c-amber text-accent-ink"><Icone nome="varinha" tamanho={22} /></span>
              <span className="flex flex-1 flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-c-amber">A IA parou no meio</span>
                <span className="font-bold leading-snug">{pilotoParado.nome}: toque pra ela terminar</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-c-amber">Continuar →</span>
            </Link>
          ) : null}

          {parou ? (
            <Link href={parou.path} className="surge flex items-center gap-3 rounded-2xl border border-c-sky/50 bg-[color-mix(in_srgb,var(--c-sky)_10%,var(--surface))] p-4 text-text no-underline transition-colors hover:border-c-sky">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-c-sky/20 text-c-sky"><Icone nome={parou.tipo === "aula" ? "play" : "passos"} tamanho={22} /></span>
              <span className="flex flex-1 flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-c-sky">Você parou aqui</span>
                <span className="font-bold leading-snug">{parou.titulo}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-c-sky">Continuar →</span>
            </Link>
          ) : null}

          {/* I1 · próximo passo */}
          <section className="flex flex-col gap-3 rounded-2xl border border-accent bg-sel p-4" aria-labelledby="prox">
            <span className="kk">{continuar ? "CONTINUE DE ONDE PAROU" : "SEU PRÓXIMO PASSO"}</span>
            <h2 id="prox" className="m-0 text-[19px] font-bold leading-snug">{prox.titulo}</h2>
            {prox.descricao ? <p className="tx m-0">{prox.descricao}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Link href={prox.href} className="b1 w-auto flex-1 px-6 no-underline">{continuar ? "Continuar" : "Fazer agora"}</Link>
              {aulaExiste ? <Link href={`/app/l02/${encodeURIComponent(prox.aula!)}`} className="b2 no-underline">Ver a aula antes</Link> : null}
            </div>
          </section>

          {/* I2 · meu caminho */}
          {principal ? (
            <Link href={`/app/p/${principal.id}`} className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 text-text no-underline">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">Meu caminho · {principal.nome}</span>
                <span className="mu">{FASES[principal.fase]}</span>
              </div>
              <ol className="m-0 grid list-none grid-cols-7 gap-1 p-0" aria-label="Fases">
                {FASES.map((f, i) => (
                  <li key={f} className="flex flex-col items-center gap-1">
                    <span className={`h-1.5 w-full rounded-full ${i < principal.fase ? "bg-ok" : i === principal.fase ? "bg-accent" : "bg-line"}`} />
                    <span className={`text-[10px] leading-tight ${i === principal.fase ? "font-bold text-text" : "text-muted"} max-sm:hidden`}>{f}</span>
                  </li>
                ))}
              </ol>
              <span className="text-[13px] font-semibold text-accent-2">Abrir a pasta</span>
            </Link>
          ) : null}
          {principal && principal.etapas.some((e) => e.ok && e.slug !== "entenda") ? (
            <Link href={`/app/p/${principal.id}/pronto`} className="flex items-center gap-3 rounded-2xl border border-ok-line bg-ok-bg px-4 py-3 text-ok-text no-underline">
              <Icone nome="olho" tamanho={18} />
              <span className="flex-1 text-sm font-bold">Ver tudo que já está pronto</span>
              <span aria-hidden>→</span>
            </Link>
          ) : null}

          <div className="cd">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Suas aulas</span>
              <span className="mu">{j.vistas} de {j.total} vistas</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-[3px] bg-line"><div className="rounded-[3px] bg-[#6FD3A0]" style={{ width: `${pct}%` }} /></div>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: "Meus produtos", d: `${pastas.length} pasta${pastas.length === 1 ? "" : "s"}`, href: "/app/v01" },
              { t: "Aulas", d: `${j.vistas} de ${j.total} vistas`, href: "/app/l01" },
              { t: "Professora", d: "Tire uma dúvida", href: "/app/q01" },
              { t: "Glossário", d: "As palavras do SDM", href: "/app/l04" },
            ].map((a) => (
              <Item key={a.t} href={a.href} className="min-h-[84px] flex-col items-start gap-1 border border-line bg-surface">
                <span className="text-sm font-bold">{a.t}</span>
                <span className="mu">{a.d}</span>
              </Item>
            ))}
          </div>
          {marca.fotoAmanda ? (
            <div className="surge flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={marca.fotoAmanda} alt={marca.nomeAmanda ?? "Amanda Gomes"} className="size-14 shrink-0 rounded-full border-2 border-accent object-cover" />
              <span className="flex flex-col"><span className="text-sm font-bold">{marca.nomeAmanda ?? "Amanda Gomes"}</span><span className="mu text-sm">{marca.recado || "Estou com você em cada passo."}</span></span>
            </div>
          ) : null}
          {/* I5 · novidades */}
          <div className="flex flex-col gap-0.5 rounded-[14px] border border-ok-line bg-ok-bg p-3">
            <span className="text-[11px] font-bold tracking-[0.5px] text-ok">NOVIDADES · PLANTÃO DA SEMANA</span>
            <span className="text-sm font-bold">A Amanda responde as dúvidas mais feitas</span>
            <span className="mu text-ok-text">[o time publica o plantão pelo admin]</span>
          </div>
        </div>
      </div>
    </>
  );
}
