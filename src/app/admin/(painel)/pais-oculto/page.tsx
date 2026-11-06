import { inArray } from "drizzle-orm";
import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { CATALOGO_OCULTO } from "@/lib/domain/pais-oculto";
import { configOculto } from "@/lib/server/pais-oculto";
import { LiberarForm, OpcoesForm, RemoverBotao } from "./forms";

export const metadata = { title: "País Oculto" };

/** Área secreta: quem pode entrar, quais países aparecem e a frase do convite. */
export default async function AdminPaisOculto() {
  const admin = await requireAdmin(["admin", "suporte"]);
  const cfg = await configOculto();
  const alunas = cfg.alunas.length
    ? await db().select({ id: schema.students.id, nome: schema.students.nome, email: schema.students.email, code: schema.students.code, cartoes: schema.students.cartoes }).from(schema.students).where(inArray(schema.students.id, cfg.alunas))
    : [];
  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="SECRETO" t="País Oculto" d="Uma IA liberada só pra quem você escolher. Ela acha mercados escondidos e entrega o produto e a estratégia secreta. Quem não está na lista nem vê que existe." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="acd gap-3">
          <h2 className="m-0 text-base font-bold">Liberar alunas</h2>
          <p className="mu m-0 text-sm">Cole os e-mails (um por linha ou separados por vírgula). A aluna precisa já ter conta.</p>
          <LiberarForm />
        </div>
        <div className="acd gap-3">
          <h2 className="m-0 text-base font-bold">Com acesso ({alunas.length})</h2>
          {alunas.length ? (
            <ul className="m-0 flex max-h-96 list-none flex-col gap-1.5 overflow-auto p-0">
              {alunas.map((a) => {
                const o = (a.cartoes as { oculto?: { abertoEm?: string; mapa?: unknown; estrategias?: Record<string, unknown> } } | null)?.oculto;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold">{a.nome} <span className="font-normal text-muted">· {a.code}</span></span>
                      <span className="truncate text-xs text-muted">{a.email} · {o?.abertoEm ? `abriu o portão${o.mapa ? ", viu o mapa" : ""}${o.estrategias ? `, ${Object.keys(o.estrategias).length} estratégia(s)` : ""}` : "ainda não entrou"}</span>
                    </span>
                    <RemoverBotao studentId={a.id} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className="mu text-sm">Ninguém ainda.</span>
          )}
        </div>
      </div>
      {admin.papel === "admin" ? (
        <div className="acd gap-3">
          <h2 className="m-0 text-base font-bold">Opções</h2>
          <OpcoesForm ligado={cfg.ligado} convite={cfg.convite} paises={CATALOGO_OCULTO.map((p) => ({ k: p.k, nome: p.nome, idioma: p.idioma, moeda: p.moeda, ligado: !cfg.desligados.includes(p.k) }))} />
        </div>
      ) : null}
    </section>
  );
}
