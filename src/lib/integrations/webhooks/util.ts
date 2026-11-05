import { createHash, timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

/** Lê o primeiro caminho que existir (payloads mudam entre versões). */
export function pick(obj: unknown, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = obj;
    for (const k of p.split(".")) {
      if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) cur = (cur as Record<string, unknown>)[k];
      else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined && cur !== null && cur !== "") return cur;
  }
  return undefined;
}

export const str = (v: unknown) => (v === undefined || v === null ? null : String(v));
