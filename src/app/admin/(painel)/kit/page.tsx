import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { alternarPeca } from "@/lib/actions/admin-sdm";
import { AdminHead } from "../head";
import { NovaPeca } from "./nova";

export const metadata = { title: "Kit do SDM" };

// Kit de divulgação do SDM (caminho A3): peças prontas do time; a aluna adapta com a IA.
export default async function Kit() {
  await requireAdmin(["conteudo"]);
  const pecas = await db().select().from(schema.kitPieces).orderBy(asc(schema.kitPieces.ordem), asc(schema.kitPieces.createdAt));
  return (
    <>
      <AdminHead id="KIT" t="Kit de divulgação do SDM" d="Peças prontas que as afiliadas usam. A IA só adapta o idioma, nunca a promessa." />
      <NovaPeca />
      <div className="grid gap-3 xl:grid-cols-2">
        {pecas.map((p) => (
          <div key={p.id} className="acd">
            <div className="flex items-center justify-between gap-2"><span className="kk">{p.tipo.toUpperCase()} · {p.idioma}</span><span className={p.ativo ? "text-xs text-ok" : "text-xs text-warn"}>{p.ativo ? "ativa" : "pausada"}</span></div>
            <span className="font-bold">{p.titulo}</span>
            {p.texto ? <p className="mu m-0 whitespace-pre-line text-[13px]">{p.texto}</p> : null}
            <form action={alternarPeca.bind(null, p.id, !p.ativo)}><button className="ab2">{p.ativo ? "Pausar" : "Ativar"}</button></form>
          </div>
        ))}
      </div>
    </>
  );
}
