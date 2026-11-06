import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { AULAS_VISUAL_KEY, lerAulasVisual } from "@/lib/domain/aulas-visual";
import { getSetting } from "@/lib/server/settings";
import { AdminHead } from "../../../head";
import { Apagar, AulaForm, ImagemUpload } from "../../forms";

export const metadata = { title: "Aula" };

/** Admin → Aulas → aula: dados, trilha, publicação e capa. id "nova" (com ?trilha=M1) = criar. */
export default async function EditarAula({ params, searchParams }: PageProps<"/admin/aulas/aula/[id]">) {
  await requireAdmin(["admin", "conteudo"]);
  const id = decodeURIComponent((await params).id);
  const sp = await searchParams;
  const trilhas = await db().select({ id: schema.modules.id, nome: schema.modules.nome }).from(schema.modules).orderBy(asc(schema.modules.ordem), asc(schema.modules.id));
  const voltar = <Link href="/admin/aulas" className="ab2 no-underline">Voltar pras aulas</Link>;

  if (trilhas.length === 0) {
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <AdminHead id="AULAS" t="Nova aula">{voltar}</AdminHead>
        <p className="warn m-0">Crie uma trilha antes de criar aulas.</p>
      </section>
    );
  }

  if (id === "nova") {
    const pedida = String(sp.trilha ?? "");
    const moduleId = trilhas.some((t) => t.id === pedida) ? pedida : trilhas[0]!.id;
    return (
      <section className="flex max-w-3xl flex-col gap-6">
        <AdminHead id="AULAS" t="Nova aula" d="Depois de criar você sobe a capa.">{voltar}</AdminHead>
        <AulaForm
          modo="criar"
          trilhas={trilhas}
          inicial={{ id: "", moduleId, titulo: "", tipo: null, minutos: null, objetivo: null, agoraFacaTexto: null, agoraFacaAlvo: null, videoUrl: null, requerEntitlements: [], ordem: null, publicada: false, regravar: false }}
        />
      </section>
    );
  }

  const [a, vRaw] = await Promise.all([db().query.lessons.findFirst({ where: eq(schema.lessons.id, id) }), getSetting<unknown>(AULAS_VISUAL_KEY, null)]);
  if (!a) notFound();
  const v = lerAulasVisual(vRaw);
  const capa = v.aulas[a.id]?.capa ?? null;
  const reserva = v.modulos[a.moduleId]?.banner ?? v.modulos[a.moduleId]?.capa ?? null;

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <AdminHead id="AULAS" t={`Aula ${a.id}`} d={a.titulo}>
        <div className="flex flex-wrap gap-2">
          {a.publicada ? <Link href={`/app/l02/${encodeURIComponent(a.id)}`} className="ab2 no-underline">Ver no app</Link> : null}
          {voltar}
        </div>
      </AdminHead>
      {sp.criada ? <p className="good m-0">Aula criada. Agora suba a capa e publique quando estiver pronta.</p> : null}
      <AulaForm
        modo="editar"
        trilhas={trilhas}
        inicial={{
          id: a.id,
          moduleId: a.moduleId,
          titulo: a.titulo,
          tipo: a.tipo,
          minutos: a.minutos,
          objetivo: a.objetivo,
          agoraFacaTexto: a.agoraFacaTexto,
          agoraFacaAlvo: a.agoraFacaAlvo,
          videoUrl: a.videoUrl,
          requerEntitlements: a.requerEntitlements,
          ordem: a.ordem,
          publicada: a.publicada,
          regravar: a.regravar,
        }}
      />
      <section className="acd gap-3" aria-label="Capa da aula">
        <ImagemUpload tipo="aula-capa" id={a.id} url={capa} titulo="Capa da aula" ajuda={`16:9 (ex.: 1280 x 720). PNG, JPG ou WEBP até 4 MB.${!capa && reserva ? " Sem capa, o app mostra o banner da trilha." : ""}`} />
      </section>
      <section className="acd gap-3" aria-label="Apagar aula">
        <Apagar tipo="aula" id={a.id} bloqueio={a.publicada ? "Aula publicada não pode ser apagada. Desmarque \"Publicada\", salve e depois apague." : null} />
      </section>
    </section>
  );
}
