"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudent } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { MERCADOS } from "@/lib/domain/mercados";
import { pastaDaAluna } from "@/lib/server/pastas";
import { definirMercado, gerarFicha, gerarIdeias, gerarOferta, rascunhoFicha } from "./caminhos";
import { gerarCapitulo, gerarExtras, gerarSumario, salvarSumario } from "./ebook";

/**
 * "A IA faz tudo": a tela chama um passo por vez (cada um cabe no tempo da Vercel)
 * e mostra o progresso real. Cada passo pula o que já está feito, então dá pra tentar de novo.
 * Para antes da Revisão: ali é ela quem confere e aprova (regra 4).
 */
type Passo = "fim" | "extras" | "inicio" | "ideias" | "escolha" | "rascunho" | "ficha" | "oferta" | "mercado" | "sumario" | `capitulo:${number}`;
export type RespPiloto = { ok?: boolean; erro?: string; capitulos?: number; ideia?: string };

async function salvar(id: string, patch: Record<string, unknown>) {
  await db()
    .update(schema.studentProducts)
    .set({ dados: sql`${schema.studentProducts.dados} || ${JSON.stringify(patch)}::jsonb` })
    .where(eq(schema.studentProducts.id, id));
}

export async function pilotoPasso(pastaId: string, passo: Passo): Promise<RespPiloto> {
  if (!z.string().uuid().safeParse(pastaId).success) return { erro: "Pasta inválida." };
  const ctx = await pastaDaAluna(pastaId);
  if (!ctx || ctx.pasta.tipo !== "proprio") return { erro: "Pasta não encontrada." };
  const p = ctx.pasta;
  const dados = (p.dados ?? {}) as Record<string, unknown>;
  const r = await (async (): Promise<RespPiloto> => {
    switch (true) {
      case passo === "inicio":
        await salvar(p.id, { feito: { ...((dados.feito as object) ?? {}), entenda: true }, piloto: { em: new Date().toISOString(), fim: null } });
        return { ok: true };
      case passo === "fim":
        await salvar(p.id, { piloto: { ...((dados.piloto as object) ?? {}), fim: new Date().toISOString() } });
        return { ok: true };
      case passo === "ideias":
        return dados.ideias ? { ok: true } : gerarIdeias(p.id, false);
      case passo === "escolha": {
        if (dados.ideia) return { ok: true, ideia: (dados.ideia as { nome_provisorio?: string }).nome_provisorio };
        const ideia = ((dados.ideias as { nome_provisorio: string }[] | undefined) ?? [])[0];
        if (!ideia) return { erro: "Sem ideias pra escolher." };
        await salvar(p.id, { ideia });
        await db().update(schema.studentProducts).set({ nome: ideia.nome_provisorio }).where(eq(schema.studentProducts.id, p.id));
        return { ok: true, ideia: ideia.nome_provisorio };
      }
      case passo === "rascunho": {
        const resp = dados.fichaRespostas as { o_que_sabe?: string } | undefined;
        return (resp?.o_que_sabe ?? "").trim().length >= 10 ? { ok: true } : rascunhoFicha(p.id);
      }
      case passo === "ficha": {
        if (dados.ficha) return { ok: true };
        const resp = (dados.fichaRespostas ?? {}) as Record<string, string>;
        const f = new FormData();
        Object.entries(resp).forEach(([k, v]) => f.set(k, v));
        return gerarFicha(p.id, null, f);
      }
      case passo === "oferta": {
        const o = dados.oferta as Record<string, unknown> | undefined;
        if (o?.aprovada) return { ok: true };
        if (!o) {
          const g = await gerarOferta(p.id, false);
          if (g.erro) return g;
        }
        const atual = (await pastaDaAluna(p.id))!.pasta.dados as { oferta?: Record<string, unknown> };
        await salvar(p.id, { oferta: { ...atual.oferta, aprovada: true, aprovadaPelaIa: true } });
        return { ok: true };
      }
      case passo === "mercado": {
        if (dados.mercado) return { ok: true };
        const { student } = await requireStudent();
        const d = await db().query.diagnostics.findFirst({ where: eq(schema.diagnostics.studentId, student.id), orderBy: desc(schema.diagnostics.versao) });
        const sug = (d?.resultado as { pais_venda?: { k?: string } } | null)?.pais_venda?.k ?? p.paisVenda ?? "eua";
        return definirMercado(p.id, (MERCADOS as readonly string[]).includes(sug) ? sug : "eua");
      }
      case passo === "sumario": {
        const eb = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, p.id), eq(schema.ebooks.studentId, p.studentId)) });
        if (!eb) {
          const f = new FormData();
          f.set("capitulos", "6");
          f.set("tom", "amiga");
          f.set("tamanho", "20");
          const g = await gerarSumario(p.id, null, f);
          if (g.erro) return g;
        }
        const e2 = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, p.id), eq(schema.ebooks.studentId, p.studentId)) });
        const caps = ((e2?.capitulos ?? []) as { titulo: { x: string }; objetivo: string }[]).map((c) => ({ titulo: c.titulo.x, objetivo: c.objetivo }));
        if (!(e2?.ideia as { sumarioAprovado?: boolean } | null)?.sumarioAprovado) {
          const s = await salvarSumario(p.id, caps, true);
          if (s.erro) return s;
        }
        return { ok: true, capitulos: caps.length };
      }
      case passo === "extras": {
        const eb = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, p.id), eq(schema.ebooks.studentId, p.studentId)) });
        return (eb?.ideia as { extras?: unknown } | null)?.extras ? { ok: true } : gerarExtras(p.id);
      }
      case passo.startsWith("capitulo:"): {
        const i = Number(passo.split(":")[1]);
        const eb = await db().query.ebooks.findFirst({ where: and(eq(schema.ebooks.studentProductId, p.id), eq(schema.ebooks.studentId, p.studentId)) });
        const cap = ((eb?.capitulos ?? []) as { texto?: unknown }[])[i];
        if (!cap) return { erro: "Capítulo inválido." };
        return cap.texto ? { ok: true } : gerarCapitulo(p.id, i, null);
      }
      default:
        return { erro: "Passo desconhecido." };
    }
  })();
  revalidatePath("/app", "layout");
  return r;
}
