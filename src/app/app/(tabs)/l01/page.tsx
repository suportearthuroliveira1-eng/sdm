import type { Metadata } from "next";
import Link from "next/link";
import { Bar, Item, LockIcon, PageTitle, PlayIcon } from "@/components/app/ui";
import { AULAS_VISUAL_KEY, lerAulasVisual } from "@/lib/domain/aulas-visual";
import { getJornada } from "@/lib/server/aluna";
import { getSetting } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Aulas" };

// L01 · Grade de aulas (protótipo): progresso, continuar, módulos por parte.
export default async function L01() {
  const [j, vRaw] = await Promise.all([getJornada(), getSetting<unknown>(AULAS_VISUAL_KEY, null)]);
  const v = lerAulasVisual(vRaw);
  const pct = j.total ? Math.round((j.vistas / j.total) * 100) : 0;
  const partes = [...new Set(j.modulos.map((m) => m.parte ?? ""))];
  return (
    <>
      <PageTitle right={<span className="rounded-[10px] bg-ok-bg px-2.5 py-1 text-[11px] font-bold text-ok">PLANTÃO TODA SEMANA</span>}>Aulas</PageTitle>
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="mu text-[13px]">{j.vistas} de {j.total} aulas vistas</span>
          <Bar pct={pct} />
        </div>
        {j.proxima ? (
          <Item href={`/app/l02/${encodeURIComponent(j.proxima.id)}`} className="border border-accent bg-sel">
            {PlayIcon}
            <span className="flex flex-col gap-0.5">
              <span className="kk">CONTINUAR DE ONDE PAROU</span>
              <span className="text-[15px] font-bold">{j.proxima.titulo}</span>
              <span className="mu text-text-2">Aula {j.proxima.id}{j.proxima.minutos ? ` · ${j.proxima.minutos} min` : ""}</span>
            </span>
          </Item>
        ) : null}
        <div className="grid grid-cols-2 gap-2 lg:max-w-md">
          <Link href="/app/l04" className="b2 no-underline">Glossário</Link>
          <span aria-disabled="true" className="b2 opacity-50">Plantão da semana</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {partes.map((parte) => (
            <section key={parte} className="flex flex-col gap-2" aria-label={parte}>
              <span className="kk text-xs">{parte.toUpperCase()}</span>
              {j.modulos
                .filter((m) => (m.parte ?? "") === parte)
                .map((m) => {
                  const vistas = m.aulas.filter((a) => a.vista && !a.po).length;
                  const reais = m.aulas.filter((a) => !a.po).length;
                  const vis = v.modulos[m.id] ?? {};
                  const topo = vis.banner ?? vis.capa;
                  return (
                    <details key={m.id} className="group overflow-hidden rounded-[14px] border border-line bg-surface open:bg-surface-2" style={vis.cor ? { borderColor: vis.cor } : undefined}>
                      <summary className="flex min-h-11 cursor-pointer list-none flex-col [&::-webkit-details-marker]:hidden">
                        {topo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={topo} alt={`Trilha ${m.nome}`} loading="lazy" className={`aspect-[16/6] w-full object-cover ${m.lock.travado ? "opacity-50 grayscale" : ""}`} />
                        ) : null}
                        <span className="flex items-center gap-3 p-3">
                        <span className="flex flex-1 flex-col gap-0.5">
                          <span className={`text-[15px] font-bold ${m.lock.travado ? "text-muted" : ""}`}>{m.id} · {m.nome}</span>
                          <span className="mu">{m.lock.travado ? m.lock.motivo : `${vistas} de ${reais} aulas vistas`}</span>
                        </span>
                        <span className="mu text-base transition group-open:rotate-90" aria-hidden>›</span>
                        </span>
                      </summary>
                      <ul className="m-0 flex list-none flex-col gap-1 px-2 pb-2">
                        {m.aulas.map((a) => (
                          <li key={a.id}>
                            {a.lock.travado ? (
                              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted">
                                <span className="dot border-2 border-line-2">{LockIcon}</span>
                                <span className="flex flex-1 flex-col gap-0.5">
                                  <span className="text-sm font-semibold">{a.titulo}</span>
                                  <span className="mu">{a.id} · {a.lock.motivo}</span>
                                </span>
                              </div>
                            ) : (
                              <Link href={`/app/l02/${encodeURIComponent(a.id)}`} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-text no-underline hover:bg-sel">
                                <span className={`dot border-2 ${a.vista ? "border-ok bg-ok text-accent-ink" : "border-line-2 text-muted"}`} aria-label={a.vista ? "vista" : "não vista"}>
                                  {a.vista ? "✓" : ""}
                                </span>
                                {v.aulas[a.id]?.capa ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={v.aulas[a.id]!.capa} alt="" loading="lazy" className="h-10 w-16 shrink-0 rounded-lg object-cover" />
                                ) : null}
                                <span className="flex flex-1 flex-col gap-0.5">
                                  <span className="text-sm font-semibold">{a.titulo}</span>
                                  <span className="mu">{a.id}{a.tipo ? ` · ${a.tipo}` : ""}{a.minutos ? ` · ${a.minutos} min` : ""}</span>
                                </span>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
