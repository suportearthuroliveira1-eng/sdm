export const PRODUCTS = ["sdm", "up1", "d1", "up2", "d2"] as const;
export type Product = (typeof PRODUCTS)[number];

export const PRODUCT_LABEL: Record<Product, string> = {
  sdm: "SDM",
  up1: "UP1",
  d1: "D1",
  up2: "UP2",
  d2: "D2",
};

export type EntitlementLike = {
  produto: Product;
  status: "active" | "revoked" | "refunded" | "chargeback" | "expired";
  fimEm?: Date | null;
};

export function isActive(e: EntitlementLike, now = new Date()) {
  return e.status === "active" && (!e.fimEm || e.fimEm.getTime() > now.getTime());
}

export function hasProduct(list: EntitlementLike[], product: Product, now = new Date()) {
  return list.some((e) => e.produto === product && isActive(e, now));
}

/** Entra no app só quem tem SDM ativo. */
export function canEnterApp(list: EntitlementLike[], now = new Date()) {
  return hasProduct(list, "sdm", now);
}

export type PurchaseKind = "grant" | "revoke_refund" | "revoke_chargeback" | "revoke_cancel" | "ignore";

export function statusForKind(kind: PurchaseKind): EntitlementLike["status"] | null {
  switch (kind) {
    case "grant":
      return "active";
    case "revoke_refund":
      return "refunded";
    case "revoke_chargeback":
      return "chargeback";
    case "revoke_cancel":
      return "revoked";
    case "ignore":
      return null;
  }
}

/** O que cada acesso libera (texto do protótipo Admin, AD08). */
export const PRODUCT_DESC: Record<Product, { nome: string; libera: string }> = {
  sdm: { nome: "SDM · front US$69", libera: "App, tronco comum, trilhas, M6, professora, bônus" },
  up1: { nome: "UP1 · Países Ocultos feito pelo time", libera: "Aulas PO.1 a PO.5" },
  d1: { nome: "D1 · Combinação pronta", libera: "Aulas PO.1 a PO.5" },
  up2: { nome: "UP2 · Mentoria Private", libera: "Mentoria em turma" },
  d2: { nome: "D2 · Gravações + grupo", libera: "Gravações e grupo" },
};
