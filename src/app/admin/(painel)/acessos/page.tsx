import { desc } from "drizzle-orm";
import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { PRODUCTS, PRODUCT_DESC, PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { getFlag } from "@/lib/server/settings";
import { deleteProductMapAction, reprocessEventAction, upsertProductMapAction } from "@/lib/actions/admin";
import { env } from "@/lib/env";
import { emailConfigurado } from "@/lib/integrations/email";
import { statusSegredo } from "@/lib/server/segredos";
import { HublaCard } from "./hubla-card";

export const metadata = { title: "Acessos e webhooks" };

// AD08 · Mapa produto → entitlement, log de eventos, reprocessar.
export default async function AD08() {
  await requireAdmin(["admin"]);
  const [map, evts, hubla, hotmart, token, temEmail] = await Promise.all([
    db().select().from(schema.hublaProductMap).orderBy(schema.hublaProductMap.provider),
    db().select().from(schema.events).orderBy(desc(schema.events.createdAt)).limit(50),
    getFlag("auth_hubla_webhook"),
    getFlag("auth_hotmart_webhook"),
    statusSegredo("HUBLA_WEBHOOK_TOKEN"),
    emailConfigurado(),
  ]);
  const produtoDo = (payload: unknown) => {
    const ev = (payload as { event?: { product?: { id?: string; name?: string }; user?: { email?: string }; invoice?: { payer?: { email?: string } } } })?.event;
    return { id: ev?.product?.id ?? "", nome: ev?.product?.name ?? "", email: ev?.user?.email ?? ev?.invoice?.payer?.email ?? "" };
  };
  const fmt = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return (
    <>
      <AdminHead id="AD08" t="Acessos e webhooks" d="Hubla → o que libera no App" />
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead><tr><th className="border-b border-line px-3 py-2.5 text-left font-semibold text-muted">Acesso</th><th className="border-b border-line px-3 py-2.5 text-left font-semibold text-muted">Libera no App</th><th className="border-b border-line px-3 py-2.5 text-left font-semibold text-muted">Produtos mapeados</th></tr></thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const n = map.filter((m) => m.produto === p && m.ativo).length;
              return (
                <tr key={p}>
                  <td className="border-b border-line-3 p-3 font-semibold">{PRODUCT_DESC[p].nome}</td>
                  <td className="border-b border-line-3 p-3">{PRODUCT_DESC[p].libera}</td>
                  <td className="border-b border-line-3 p-3">{n ? <span className="inline-block rounded-[10px] bg-ok-bg px-2 py-1 text-[11px] font-bold text-ok">{n} configurado{n > 1 ? "s" : ""}</span> : <span className="inline-block rounded-[10px] bg-warn-bg px-2 py-1 text-[11px] font-bold text-warn">falta mapear</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <HublaCard ligado={hubla} url={`${env().APP_URL}/api/webhooks/hubla`} temToken={Boolean(token.origem)} temEmail={temEmail} mapeados={map.filter((m) => m.provider === "hubla" && m.ativo).length} />
      <div className="acd"><p className="text-sm text-muted">Webhook Hotmart · <code>/api/webhooks/hotmart</code></p><p className={hotmart ? "text-ok" : "text-warn"}>{hotmart ? "ligado" : "desligado"}</p></div>

      <div className="acd flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Mapa produto → acesso</h2>
        <form action={upsertProductMapAction} className="grid gap-3 sm:grid-cols-5">
          <div><label htmlFor="m-prov" className="lb mb-1.5 block text-muted">Plataforma</label><select id="m-prov" name="provider" className="ain"><option value="hubla">Hubla</option><option value="hotmart">Hotmart</option></select></div>
          <div><label htmlFor="m-ext" className="lb mb-1.5 block text-muted">ID do produto lá</label><input id="m-ext" name="externalProductId" required className="ain" /></div>
          <div><label htmlFor="m-prod" className="lb mb-1.5 block text-muted">Libera</label><select id="m-prod" name="produto" className="ain">{PRODUCTS.map((p) => <option key={p} value={p}>{PRODUCT_LABEL[p]}</option>)}</select></div>
          <div><label htmlFor="m-desc" className="lb mb-1.5 block text-muted">Descrição</label><input id="m-desc" name="descricao" className="ain" /></div>
          <div className="flex items-end"><button className="ab1 w-full">Salvar</button></div>
        </form>
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">Plataforma</th><th>ID externo</th><th>Libera</th><th>Descrição</th><th /></tr></thead>
          <tbody>
            {map.length === 0 ? <tr><td colSpan={5} className="py-3 text-muted">Nenhum produto mapeado.</td></tr> : map.map((m) => (
              <tr key={m.id} className="border-t border-line/60">
                <td className="py-2">{m.provider}</td><td className="font-mono">{m.externalProductId}</td><td>{PRODUCT_LABEL[m.produto]}</td><td className="text-muted">{m.descricao ?? ""}</td>
                <td className="text-right"><form action={deleteProductMapAction.bind(null, m.id)}><button className="ab2 min-h-9 px-3 text-xs">Apagar</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="acd overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Últimos eventos</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-muted"><tr><th className="py-2">ID</th><th>Tipo</th><th>Produto (ID pra mapear)</th><th>Comprador</th><th>Quando</th><th>Status</th><th /></tr></thead>
          <tbody>
            {evts.length === 0 ? <tr><td colSpan={7} className="py-3 text-muted">Nenhum evento recebido.</td></tr> : evts.map((e) => (
              <tr key={e.id} className="border-t border-line/60">
                <td className="py-2 font-mono">{e.code}</td><td>{e.tipo}</td><td><span className="font-mono text-xs">{produtoDo(e.payload).id}</span>{produtoDo(e.payload).nome ? <span className="block text-xs text-muted">{produtoDo(e.payload).nome}</span> : null}</td><td className="text-xs text-muted">{produtoDo(e.payload).email}</td><td className="text-muted">{fmt(e.createdAt)}</td>
                <td>{e.processado ? <span className="text-ok">processado</span> : e.erro ? <span className="text-danger" title={e.erro}>erro: {e.erro}</span> : <span className="text-warn">pendente</span>}</td>
                <td className="text-right"><form action={reprocessEventAction.bind(null, e.id)}><button className="ab2 min-h-9 px-3 text-xs">Reprocessar</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
