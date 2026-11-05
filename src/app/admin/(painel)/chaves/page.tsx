import { AdminHead } from "../head";
import { requireAdmin } from "@/lib/auth/admin";
import { SEGREDOS_EDITAVEIS, statusSegredo, type SegredoKey } from "@/lib/server/segredos";
import { SegredoForm } from "./form";

export const metadata = { title: "Chaves e variáveis" };

/** Variáveis que só existem na Vercel (o app precisa delas pra ligar, então não dá pra guardar no banco). */
const SO_VERCEL = [
  { k: "DATABASE_URL", d: "Endereço do banco (pooler do Supabase, porta 6543)." },
  { k: "SUPABASE_SERVICE_ROLE_KEY", d: "Chave secret do Supabase (criar contas, links de acesso, arquivos)." },
  { k: "ADMIN_EMAIL", d: "E-mail do primeiro admin." },
  { k: "WHATSAPP_PROVIDER", d: "Provedor de WhatsApp (hoje: log)." },
  { k: "HUBLA_WEBHOOK_SECRET", d: "Segredo do webhook da Hubla (quando a integração ligar)." },
  { k: "HOTMART_HOTTOK", d: "Token do webhook da Hotmart (quando ligar)." },
];

export default async function Chaves() {
  await requireAdmin(["admin"]);
  const editaveis = await Promise.all(
    (Object.keys(SEGREDOS_EDITAVEIS) as SegredoKey[]).map(async (k) => ({ k, def: SEGREDOS_EDITAVEIS[k], st: await statusSegredo(k) })),
  );
  return (
    <section className="flex max-w-3xl flex-col gap-8">
      <AdminHead id="CHAVES" t="Chaves e variáveis" d="Chaves de serviços que você cadastra aqui ficam guardadas só no servidor. Ninguém vê o valor depois de salvo, nem o time." />
      {editaveis.map(({ k, def, st }) => (
        <div key={k} className="acd flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[17px] font-bold">{def.nome}</span>
              <span className="font-mono text-xs text-muted">{k}</span>
            </div>
            {st.origem ? (
              <span className="rounded-full bg-ok-bg px-3 py-1 text-xs font-bold text-ok">Ligada · termina em {st.fim} · {st.origem === "admin" ? "cadastrada aqui" : "na Vercel"}</span>
            ) : (
              <span className="rounded-full bg-warn-bg px-3 py-1 text-xs font-bold text-warn-text">Desligada</span>
            )}
          </div>
          <p className="mu text-sm">{def.ajuda}</p>
          <SegredoForm k={k} tem={st.origem === "admin"} />
        </div>
      ))}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Só na Vercel</h2>
        <p className="mu text-sm">Essas o app precisa pra ligar, então ficam em Vercel → Settings → Environment Variables (depois, Redeploy).</p>
        {SO_VERCEL.map((v) => (
          <div key={v.k} className="acd flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex flex-col">
              <span className="font-mono text-sm">{v.k}</span>
              <span className="mu text-xs">{v.d}</span>
            </div>
            {process.env[v.k] ? <span className="text-xs font-bold text-ok">Definida</span> : <span className="text-xs font-bold text-muted">Não definida</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
