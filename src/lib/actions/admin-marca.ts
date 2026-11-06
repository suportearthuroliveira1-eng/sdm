"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/lib/db";
import { marcaSchema, type Marca } from "@/lib/domain/marca";
import { audit } from "@/lib/server/audit";
import { salvarImagemPublica } from "@/lib/server/imagens";
import { marcaApp } from "@/lib/server/marca";

type R = { ok?: boolean; erro?: string; msg?: string } | null;

async function gravar(m: Marca) {
  const r = marcaSchema.safeParse(m);
  if (!r.success) throw new Error(r.error.issues[0]?.message ?? "inválido");
  await db()
    .insert(schema.settings)
    .values({ key: "marca", value: r.data, grupo: "personalizar", descricao: "Foto da Amanda, ícone e nome no app (Admin → Marca).", pendente: false })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: r.data, pendente: false } });
  revalidatePath("/", "layout");
}

/** Envia a foto da Amanda ou o ícone do app. */
export async function enviarImagemMarca(campo: "fotoAmanda" | "icone", _p: R, form: FormData): Promise<R> {
  const admin = await requireAdmin(["admin"]);
  if (campo !== "fotoAmanda" && campo !== "icone") return { erro: "Campo inválido." };
  const f = form.get("arquivo");
  const r = await salvarImagemPublica("marca", f instanceof File ? f : null);
  if (!r.url) return { erro: r.erro };
  const atual = await marcaApp();
  try {
    await gravar({ ...atual, [campo]: r.url });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "inválido" };
  }
  await audit(admin.id, "marca.imagem", { tipo: "setting", id: "marca" }, { campo, de: atual[campo] ?? null, para: r.url });
  return { ok: true, msg: campo === "icone" ? "Ícone trocado. No celular, o ícone novo aparece quando ela instalar de novo." : "Foto trocada." };
}

export async function removerImagemMarca(campo: "fotoAmanda" | "icone"): Promise<R> {
  const admin = await requireAdmin(["admin"]);
  const atual = await marcaApp();
  const resto: Marca = { ...atual };
  delete resto[campo];
  await gravar(resto);
  await audit(admin.id, "marca.remover", { tipo: "setting", id: "marca" }, { campo });
  return { ok: true, msg: "Voltou pro padrão." };
}

export async function salvarTextosMarca(_p: R, form: FormData): Promise<R> {
  const admin = await requireAdmin(["admin"]);
  const atual = await marcaApp();
  const nome = String(form.get("nomeAmanda") ?? "").trim();
  const recado = String(form.get("recado") ?? "").trim();
  try {
    await gravar({ ...atual, nomeAmanda: nome || undefined, recado: recado || undefined });
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "inválido" };
  }
  await audit(admin.id, "marca.textos", { tipo: "setting", id: "marca" });
  return { ok: true, msg: "Salvo." };
}
