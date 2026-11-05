import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/lib/db";
import { getAuthUser } from "./session";

export type AdminRole = "admin" | "suporte" | "conteudo";

export const getAdmin = cache(async () => {
  const user = await getAuthUser();
  if (!user?.email) return null;
  let admin = await db().query.adminUsers.findFirst({ where: eq(schema.adminUsers.authUserId, user.id) });
  if (!admin) {
    const [linked] = await db()
      .update(schema.adminUsers)
      .set({ authUserId: user.id })
      .where(and(sql`lower(${schema.adminUsers.email}) = ${user.email.toLowerCase()}`, isNull(schema.adminUsers.authUserId)))
      .returning();
    admin = linked;
  }
  return admin && admin.ativo ? admin : null;
});

/** Barra quem não é admin ou não tem um dos papéis. "admin" sempre passa. */
export async function requireAdmin(roles: AdminRole[] = ["admin", "suporte", "conteudo"]) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/entrar");
  if (admin.papel !== "admin" && !roles.includes(admin.papel)) redirect("/admin?erro=sem-permissao");
  return admin;
}
