import { asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { AULAS_VISUAL_KEY, lerAulasVisual } from "@/lib/domain/aulas-visual";
import { getSetting } from "@/lib/server/settings";
import { AdminHead } from "../../../head";
import { Apagar, ImagemUpload, TrilhaForm } from "../../forms";

export const metadata = { title: "Trilha" };

/** Admin → Aulas → trilha: dados, capa e banner. id "nova" = criar. */
export default async function EditarTrilha({ params, searchParams }: PageProps<"/admin/aulas/trilha/[id]">) {
  await requireAdmin(["admin", "conteudo"]);
  const id = decodeURIComponent((await params).id);
  const sp = await searchParams;
  const partes = (await db().selectDistinct({ p: schema.modules.parte }).from(schema.modules).orderBy(asc(schema.modules.parte)))
    .map((r) => r.p)
    .filter((p): p is string => Boolean(p));
  const voltar = <Link href="/admin/aulas" className="ab2 no-underline">Voltar pras aulas</Link>;

  if (id === "nova") {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <AdminHead id="AULAS" t="Nova trilha" d="Depois de criar você sobe a capa e o banner.">{voltar}</AdminHead>
        <TrilhaForm modo="criar" partes={partes} />
      </section>
    );
  }

  const [m, cont, vRaw] = await Promise.all([
    db().query.modules.findFirst({ where: eq(schema.modules.id, id) }),
    db().select({ n: sql<number>`count(*)::int` }).from(schema.lessons).where(eq(schema.lessons.moduleId, id)),
    getSetting<unknown>(AULAS_VISUAL_KEY, null),
  ]);
  if (!m) notFound();
  const vis = lerAulasVisual(vRaw).modulos[m.id] ?? {};
  const n = cont[0]?.n ?? 0;

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <AdminHead id="AULAS" t={`Trilha ${m.id}`} d={`${m.nome} · ${n} aulas`}>{voltar}</AdminHead>
      {sp.criada ? <p className="good m-0">Trilha criada. Agora suba a capa e o banner.</p> : null}
      <TrilhaForm
        modo="editar"
        partes={partes}
        inicial={{ id: m.id, nome: m.nome, parte: m.parte, objetivo: m.objetivo, regraLiberacao: m.regraLiberacao, ordem: m.ordem, cor: vis.cor ?? null }}
      />
      <section className="acd gap-5" aria-label="Imagens da trilha">
        <h2 className="m-0 text-base font-bold">Imagens</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ImagemUpload tipo="trilha-capa" id={m.id} url={vis.capa ?? null} titulo="Capa da trilha" ajuda="Quadrada ou 16:9. PNG, JPG ou WEBP até 4 MB." />
          <ImagemUpload tipo="trilha-banner" id={m.id} url={vis.banner ?? null} titulo="Banner da trilha" formato="banner" ajuda="Largo (ex.: 1600 x 600). Aparece no topo do cartão da trilha e das aulas sem capa." />
        </div>
      </section>
      <section className="acd gap-3" aria-label="Apagar trilha">
        <Apagar tipo="trilha" id={m.id} bloqueio={n > 0 ? `Só dá pra apagar trilha vazia. Esta tem ${n} aula(s): mova ou apague antes.` : null} />
      </section>
    </section>
  );
}
