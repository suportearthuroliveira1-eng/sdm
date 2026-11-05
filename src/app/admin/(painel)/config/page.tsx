import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { SettingRow } from "./setting-row";

export const metadata = { title: "Configurações" };

// AD11 · Configurações (flags, modelos, limites, pendências). Editor JSON simples na Fase 1.
export default async function AD11() {
  await requireAdmin(["admin"]);
  const rows = await db().select().from(schema.settings).orderBy(schema.settings.grupo, schema.settings.key);
  const groups = [...new Set(rows.map((r) => r.grupo))];
  return (
    <section className="flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-muted">Itens marcados como <span className="text-warn">pendente</span> ainda esperam decisão da dona do produto. Toda mudança fica na auditoria.</p>
      </div>
      {groups.map((g) => (
        <div key={g} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{g}</h2>
          {rows.filter((r) => r.grupo === g).map((r) => (
            <SettingRow key={r.key} k={r.key} value={JSON.stringify(r.value)} descricao={r.descricao} pendente={r.pendente} />
          ))}
        </div>
      ))}
      {rows.length === 0 ? <p className="text-muted">Rode <code>pnpm db:seed</code> para criar as configurações.</p> : null}
    </section>
  );
}
