/**
 * Desbloqueio de módulos e aulas (protótipo: lib = compra | pago | org | venda;
 * PO = UP1 ou D1). Conferir com a seção 4.4 do contexto v6 quando chegar.
 */
import type { Product } from "./entitlements";

export type UnlockRule = "compra" | "trilha_pago" | "trilha_org" | "primeira_venda";
export type UnlockCtx = { trilhaPago: boolean; trilhaOrg: boolean; temVenda: boolean; produtos: Product[] };

export type LockReason = { travado: false } | { travado: true; motivo: string; acao: { label: string; href: string } };

export function moduleLock(rule: UnlockRule, ctx: UnlockCtx): LockReason {
  switch (rule) {
    case "compra":
      return { travado: false };
    case "trilha_pago":
      return ctx.trilhaPago ? { travado: false } : { travado: true, motivo: "Abre quando você escolher a trilha de tráfego pago (aula 5.6).", acao: { label: "Ver aula 5.6", href: "/app/l02/5.6" } };
    case "trilha_org":
      return ctx.trilhaOrg ? { travado: false } : { travado: true, motivo: "Abre quando você escolher a trilha orgânica (aula 5.6).", acao: { label: "Ver aula 5.6", href: "/app/l02/5.6" } };
    case "primeira_venda":
      return ctx.temVenda ? { travado: false } : { travado: true, motivo: "Abre quando você registrar a sua 1ª venda.", acao: { label: "Ver meus produtos", href: "/app/v01" } };
  }
}

export function lessonLock(requer: Product[], moduleRule: UnlockRule, ctx: UnlockCtx): LockReason {
  const m = moduleLock(moduleRule, ctx);
  if (m.travado) return m;
  if (requer.length && !requer.some((p) => ctx.produtos.includes(p))) {
    return { travado: true, motivo: "Aula dos Países Ocultos: faz parte do UP1 ou do D1.", acao: { label: "Falar com o time", href: "/app/a02" } };
  }
  return { travado: false };
}
