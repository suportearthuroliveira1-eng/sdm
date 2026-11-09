import { inArray, sql } from "drizzle-orm";
import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { CATALOGO_OCULTO, escassez } from "@/lib/domain/pais-oculto";
import { configOculto } from "@/lib/server/pais-oculto";
import { LiberarForm, OpcoesForm, RemoverBotao, VendaForm } from "./forms";

export const metadata = { title: "País Oculto" };

/** Área secreta: quem pode entrar, quais países aparecem e a frase do convite. */
export default async function AdminPaisOculto() {
  const admin = await requireAdmin(["admin", "suporte"]);
  const cfg = await configOculto();
  const alunas = cfg.alunas.length
    ? await db().select({ id: schema.students.id, nome: schema.students.nome, email: schema.students.email, code: schema.students.code, cartoes: schema.students.cartoes }).from(schema.students).where(inArray(schema.students.id, cfg.alunas))
    : [];
  const [{ n: interessadas } = { n: 0 }] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.students).where(sql`${schema.students.cartoes}->'oculto'->>'interesse' is not null`);
  const e = escassez(cfg.venda, cfg.alunas.length, new Date());
  const v = cfg.venda;
  const fechaLocal = v.fechaEm ? new Date(new Date(v.fechaEm).getTime() - 3 * 3600000).toISOString().slice(0, 16) : "";
  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <AdminHead id="SECRETO" t="País Oculto" d="Uma IA liberada só pra quem você escolher. Ela acha mercados escondidos e entrega o produto e a estratégia secreta. Quem não está na lista nem vê que existe. O time sempre vê.">
        <a href="/app/oculto" className="ab1 no-underline">Abrir o País Oculto</a>
      </AdminHead>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="acd gap-1"><span className="kk">COM ACESSO</span><span className="text-2xl font-bold">{cfg.alunas.length}</span></div>
        <div className="acd gap-1"><span className="kk">VAGAS RESTANTES</span><span className="text-2xl font-bold">{e.restantes ?? "sem limite"}</span></div>
        <div className="acd gap-1"><span className="kk">NA LISTA DE ESPERA</span><span className="text-2xl font-bold">{interessadas}</span><span className="mu text-xs">pediram &quot;me avise quando abrir&quot;</span></div>
      </div>
      {admin.papel === "admin" ? (
        <div className="acd gap-3">
          <h2 className="m-0 text-base font-bold">Venda {e.encerrada ? <span className="ml-2 rounded-md bg-warn-bg px-2 py-0.5 text-xs text-warn">turma fechada pra quem vê a prévia</span> : <span className="ml-2 rounded-md bg-ok-bg px-2 py-0.5 text-xs text-ok">turma aberta</span>}</h2>
          <p className="mu m-0 text-sm">Quem não tem acesso vê a prévia na aba Países Ocultos e o botão pro checkout. A escassez só aparece com dado real: vagas (restantes = vagas menos quem já tem acesso) e prazo. Sem vagas nem prazo, não aparece número nenhum.</p>
          <VendaForm aberta={v.aberta} checkoutUrl={v.checkoutUrl} preco={v.preco} vagas={v.vagas} fechaEm={fechaLocal} hublaProdutos={v.hublaProdutos.join(", ")} />
        </div>
      ) : null}
      {admin.papel === "admin" ? (
        <div className="acd gap-3">
          <h2 className="m-0 text-base font-bold">Opções</h2>
          <OpcoesForm ligado={cfg.ligado} convite={cfg.convite} paises={CATALOGO_OCULTO.map((p) => ({ k: p.k, nome: p.nome, idioma: p.idioma, moeda: p.moeda, ligado: !cfg.desligados.includes(p.k) }))} />
        </div>
      ) : null}
    </section>
  );
}
