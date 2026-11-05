import "server-only";
import { headers } from "next/headers";
import { db, schema } from "@/lib/db";

export async function audit(
  adminId: string | null,
  acao: string,
  alvo?: { tipo: string; id: string },
  dados?: Record<string, unknown>,
) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await db().insert(schema.auditLog).values({
    adminId,
    acao,
    alvoTipo: alvo?.tipo,
    alvoId: alvo?.id,
    dados: dados ?? null,
    ip,
  });
}
