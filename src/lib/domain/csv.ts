import { z } from "zod";
import { PRODUCTS, type Product } from "./entitlements";

/**
 * Importação de alunas. Cabeçalho: nome,email,whatsapp,pais,acessos
 * acessos: lista separada por "|" ou ";" (ex.: sdm|up1). Vazio = sdm.
 * Aceita separador "," ou ";" e campos entre aspas.
 */
export const studentInputSchema = z.object({
  nome: z.string().trim().min(2, "nome curto demais"),
  email: z.string().trim().toLowerCase().email("e-mail inválido"),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .optional()
    .transform((v) => (v ? v : undefined)),
  pais: z.string().trim().optional().transform((v) => (v ? v : undefined)),
  acessos: z.array(z.enum(PRODUCTS)).min(1, "marque ao menos um acesso"),
});
export type StudentInput = z.infer<typeof studentInputSchema>;

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === sep && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export type CsvRowResult =
  | { line: number; ok: true; data: StudentInput }
  | { line: number; ok: false; error: string; raw: string };

export function parseStudentsCsv(text: string): CsvRowResult[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];
  const header = lines[0]!;
  const sep = header.split(";").length > header.split(",").length ? ";" : ",";
  const cols = splitLine(header, sep).map((c) => c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  const idx = (names: string[]) => cols.findIndex((c) => names.includes(c));
  const iNome = idx(["nome", "name"]);
  const iEmail = idx(["email", "e-mail"]);
  const iWa = idx(["whatsapp", "telefone", "celular"]);
  const iPais = idx(["pais", "country"]);
  const iAc = idx(["acessos", "acesso", "produtos"]);
  if (iNome < 0 || iEmail < 0) {
    return [{ line: 1, ok: false, error: "cabeçalho precisa ter as colunas nome e email", raw: header }];
  }
  return lines.slice(1).map((raw, k) => {
    const c = splitLine(raw, sep);
    const acessosRaw = iAc >= 0 ? (c[iAc] ?? "") : "";
    const acessos = (acessosRaw ? acessosRaw.split(/[|;/ ]+/) : ["sdm"])
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean) as Product[];
    const parsed = studentInputSchema.safeParse({
      nome: c[iNome] ?? "",
      email: c[iEmail] ?? "",
      whatsapp: iWa >= 0 ? c[iWa] : undefined,
      pais: iPais >= 0 ? c[iPais] : undefined,
      acessos,
    });
    return parsed.success
      ? { line: k + 2, ok: true as const, data: parsed.data }
      : { line: k + 2, ok: false as const, error: parsed.error.issues.map((i) => i.message).join("; "), raw };
  });
}
