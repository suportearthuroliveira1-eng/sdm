import { asc } from "drizzle-orm";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { AULAS_VISUAL_KEY, lerAulasVisual, REGRA_LABEL } from "@/lib/domain/aulas-visual";
import { getSetting } from "@/lib/server/settings";
import { AdminHead } from "../head";
import { MoverAula, TrilhaForm } from "./forms";

export const metadata = { title: "Aulas" };

/** Admin → Aulas: trilhas (módulos) por parte, com capa, banner e as aulas em ordem. */
export default async function AdminAulas() {
  await requireAdmin(["admin", "conteudo"]);
  const [mods, aulas, vRaw] = await Promise.all([
    db().select().from(schema.modules).orderBy(asc(schema.modules.ordem), asc(schema.modules.id)),
    db()
      .select({ id: schema.lessons.id, moduleId: schema.lessons.moduleId, titulo: schema.lessons.titulo, minutos: schema.lessons.minutos, publicada: schema.lessons.publicada, regravar: schema.lessons.regravar, ordem: schema.lessons.ordem })
      .from(schema.lessons)
      .orderBy(asc(schema.lessons.ordem), asc(schema.lessons.id)),
    getSetting<unknown>(AULAS_VISUAL_KEY, null),
  ]);
  const v = lerAulasVisual(vRaw);
  const partes = [...new Set(mods.map((m) => m.parte ?? ""))];
  const totalPub = aulas.filter((a) => a.publicada).length;

  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="AULAS" t="Aulas e trilhas" d={`${mods.length} trilhas · ${aulas.length} aulas (${totalPub} publicadas). Capa, banner, ordem e em qual trilha cada aula fica.`} />

      <details className="acd">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
          Nova trilha <span className="mu" aria-hidden>+</span>
        </summary>
        <div className="pt-2">
          <TrilhaForm modo="criar" partes={partes.filter(Boolean)} />
        </div>
      </details>

      {mods.length === 0 ? <p className="tx">Nenhuma trilha ainda. Crie a primeira acima.</p> : null}

      {partes.map((parte) => (
        <section key={parte || "-"} className="flex flex-col gap-3" aria-label={parte || "Sem parte"}>
          <h2 className="kk m-0 text-xs">{(parte || "Sem parte").toUpperCase()}</h2>
          {mods
            .filter((m) => (m.parte ?? "") === parte)
            .map((m) => {
              const lista = aulas.filter((a) => a.moduleId === m.id);
              const pub = lista.filter((a) => a.publicada).length;
              const vis = v.modulos[m.id] ?? {};
              return (
                <article key={m.id} className="overflow-hidden rounded-2xl border border-line bg-surface" style={vis.cor ? { borderColor: vis.cor } : undefined}>
                  {vis.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={vis.banner} alt={`Banner da trilha ${m.nome}`} className="aspect-[16/5] w-full object-cover" />
                  ) : null}
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {vis.capa ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={vis.capa} alt={`Capa da trilha ${m.nome}`} className="size-16 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="mu grid size-16 shrink-0 place-items-center rounded-xl border border-dashed border-line-2 text-center">sem capa</span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-base font-bold">{m.id} · {m.nome}</span>
                        <span className="mu">{lista.length} aulas · {pub} publicadas · {REGRA_LABEL[m.regraLiberacao]} · ordem {m.ordem}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/aulas/trilha/${encodeURIComponent(m.id)}`} className="ab2 no-underline">Editar trilha</Link>
                        <Link href={`/admin/aulas/aula/nova?trilha=${encodeURIComponent(m.id)}`} className="ab2 no-underline">Nova aula nesta trilha</Link>
                      </div>
                    </div>
                    {lista.length ? (
                      <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                        {lista.map((a, i) => {
                          const capa = v.aulas[a.id]?.capa;
                          return (
                            <li key={a.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-2.5 py-2">
                              {capa ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={capa} alt="" className="h-10 w-16 shrink-0 rounded-lg object-cover" />
                              ) : (
                                <span className="h-10 w-16 shrink-0 rounded-lg border border-dashed border-line-2" aria-hidden />
                              )}
                              <Link href={`/admin/aulas/aula/${encodeURIComponent(a.id)}`} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-text no-underline hover:text-accent-2">
                                <span className="truncate text-sm font-semibold">{a.id} · {a.titulo}</span>
                                <span className="mu">
                                  {a.publicada ? <span className="font-bold text-ok">publicada</span> : <span className="font-bold text-warn">rascunho</span>}
                                  {a.regravar ? " · regravar" : ""}
                                  {a.minutos ? ` · ${a.minutos} min` : ""}
                                </span>
                              </Link>
                              <MoverAula id={a.id} titulo={`${a.id} ${a.titulo}`} primeiro={i === 0} ultimo={i === lista.length - 1} />
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p className="mu m-0">Sem aulas nesta trilha.</p>
                    )}
                  </div>
                </article>
              );
            })}
        </section>
      ))}
    </section>
  );
}
