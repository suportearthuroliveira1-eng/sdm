import "server-only";
import { randomUUID } from "node:crypto";
import { baixarArquivo, salvarArquivo } from "./storage";

/** Imagens que o app mostra pra todo mundo (capa de aula, banner, foto da Amanda, ícone). Ficam em "publico/" no bucket e saem por /api/publico/... */
const TIPOS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const MAX_IMAGEM = 4 * 1024 * 1024;

/** Salva uma imagem enviada pelo admin. Devolve a URL pública (/api/publico/<pasta>/<id>.<ext>) ou o erro. */
export async function salvarImagemPublica(pasta: "aulas" | "modulos" | "marca", arquivo: File | null): Promise<{ url?: string; erro?: string }> {
  if (!arquivo || arquivo.size === 0) return { erro: "Escolha uma imagem." };
  const ext = TIPOS[arquivo.type];
  if (!ext) return { erro: "Use PNG, JPG ou WEBP." };
  if (arquivo.size > MAX_IMAGEM) return { erro: "Imagem grande demais (máx. 4 MB)." };
  const path = `publico/${pasta}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  try {
    await salvarArquivo(path, await arquivo.arrayBuffer(), arquivo.type);
  } catch (e) {
    return { erro: `Não deu pra salvar a imagem: ${e instanceof Error ? e.message : "erro"}` };
  }
  return { url: `/api/${path}` };
}

/** Lê uma imagem pública (só o que está em publico/). */
export async function lerImagemPublica(partes: string[]) {
  if (!partes.length || partes.some((p) => !p || p === ".." || p.includes("/") || p.includes("\\"))) return null;
  const path = ["publico", ...partes].join("/");
  const ext = path.split(".").pop() ?? "";
  const tipo = Object.entries(TIPOS).find(([, e]) => e === ext)?.[0];
  if (!tipo) return null;
  try {
    return { blob: await baixarArquivo(path), tipo };
  } catch {
    return null;
  }
}
