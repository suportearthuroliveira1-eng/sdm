import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { PRODUCTS, PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { getFlag } from "@/lib/server/settings";
import { deleteProductMapAction, reprocessEventAction, upsertProductMapAction } from "@/lib/actions/admin";

export const metadata = { title: "Acessos e webhooks" };

// AD08 · Mapa produto → entitlement, log de eventos, reprocessar.
export default async function AD08() {
  await requireAdmin(["admin"]);
  const [map, evts, hubla, hotmart] = await Promise.all([
    db().select().from(schema.hublaProductMap).orderBy(schema.hublaProductMap.provider),
    db().select().from(schema.events).orderBy(desc(schema.events.createdAt)).limit(50),
    getFlag("auth_hubla_webhook"),
    getFlag("auth_hotmart_webhook"),
  ]);
  const fmt = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Acessos e webhooks</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card"><p className="text-sm text-muted">Webhook Hubla · <code>/api/webhooks/hubla</code></p><p className={hubla ? "text-ok" : "text-warn"}>{hubla ? "ligado" : "desligado (eventos são guardados, não processados)"}</p></div>
        <div className="card"><p className="text-sm text-muted">Webhook Hotmart · <code>/api/webhooks/hotmart</code></p><p className={hotmart ? "text-ok" : "text-warn"}>{hotmart ? "ligado" : "desligado"}</p></div>
      </div>

      <div className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Mapa produto → acesso</h2>
        <form action={upsertProductMapAction} className="grid gap-3 sm:grid-cols-5">
          <div><label htmlFor="m-prov" className="label">Plataforma</label><select id="m-prov" name="provider" className="field"><option value="hubla">Hubla</option><option value="hotmart">Hotmart</option></select></div>
          <div><label htmlFor="m-ext" className="label">ID do produto lá</label><input id="m-ext" name="externalProductId" required className="field" /></div>
          <div><label htmlFor="m-prod" className="label">Libera</label><select id="m-prod" name="produto" className="field">{PRODUCTS.map((p) => <option key={p} value={p}>{PRODUCT_LABEL[p]}</option>)}</select></div>
          <div><label htmlFor="m-desc" className="label">Descrição</label><input id="m-desc" name="descricao" className="field" /></div>
          <div className="flex items-end"><button className="btn-primary w-full">Salvar</button></div>
        </form>
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">Plataforma</th><th>ID externo</th><th>Libera</th><th>Descrição</th><th /></tr></thead>
          <tbody>
            {map.length === 0 ? <tr><td colSpan={5} className="py-3 text-muted">Nenhum produto mapeado.</td></tr> : map.map((m) => (
              <tr key={m.id} className="border-t border-line/60">
                <td className="py-2">{m.provider}</td><td className="font-mono">{m.externalProductId}</td><td>{PRODUCT_LABEL[m.produto]}</td><td className="text-muted">{m.descricao ?? ""}</td>
                <td className="text-right"><form action={deleteProductMapAction.bind(null, m.id)}><button className="btn-ghost min-h-9 px-3 text-xs">Apagar</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Últimos eventos</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">ID</th><th>Tipo</th><th>Quando</th><th>Status</th><th /></tr></thead>
          <tbody>
            {evts.length === 0 ? <tr><td colSpan={5} className="py-3 text-muted">Nenhum evento recebido.</td></tr> : evts.map((e) => (
              <tr key={e.id} className="border-t border-line/60">
                <td className="py-2 font-mono">{e.code}</td><td>{e.tipo}</td><td className="text-muted">{fmt(e.createdAt)}</td>
                <td>{e.processado ? <span className="text-ok">processado</span> : e.erro ? <span className="text-danger" title={e.erro}>erro: {e.erro}</span> : <span className="text-warn">pendente</span>}</td>
                <td className="text-right"><form action={reprocessEventAction.bind(null, e.id)}><button className="btn-ghost min-h-9 px-3 text-xs">Reprocessar</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
