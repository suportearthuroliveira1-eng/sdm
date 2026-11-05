/** pnpm seed:admin — cria o 1º admin com ADMIN_EMAIL (.env.local) no banco e no Supabase Auth. */
import { createClient } from "@supabase/supabase-js";
import { scriptDb } from "./lib/db";

const { db, close, schema } = scriptDb();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("ADMIN_EMAIL não definido em .env.local");
  let authUserId: string | null = null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const created = await sb.auth.admin.createUser({ email, email_confirm: true });
    authUserId = created.data.user?.id ?? null;
    if (!authUserId) {
      const link = await sb.auth.admin.generateLink({ type: "magiclink", email });
      authUserId = link.data.user?.id ?? null;
    }
  } else {
    console.warn("Supabase não configurado: admin criado só no banco (o login vincula depois).");
  }
  await db
    .insert(schema.adminUsers)
    .values({ email, papel: "admin", authUserId })
    .onConflictDoUpdate({ target: schema.adminUsers.email, set: { papel: "admin", ativo: true, ...(authUserId ? { authUserId } : {}) } });
  console.log("admin pronto (entre em /admin/entrar com o código do e-mail)");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(close);
