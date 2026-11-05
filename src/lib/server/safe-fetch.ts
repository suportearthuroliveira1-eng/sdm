import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Abre uma URL externa com proteção SSRF: só http/https, porta padrão,
 * nada de IP interno (rede privada, loopback, link-local, metadados de nuvem),
 * redirecionamentos seguidos um a um (cada salto é conferido), tempo limite.
 */
export type Salto = { url: string; status: number };
export type FetchResult = { ok: true; saltos: Salto[]; final: string; status: number; html?: string } | { ok: false; erro: string; saltos: Salto[] };

const PRIVADO = [
  /^0\./, /^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^::1$/, /^fc/i, /^fd/i, /^fe80:/i, /^::ffff:(10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\./i, /^::$/,
];
export const ipPrivado = (ip: string) => PRIVADO.some((r) => r.test(ip));

export async function urlSegura(raw: string): Promise<URL | string> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return "Endereço inválido.";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return "Use um endereço que começa com https://";
  if (u.username || u.password) return "Endereço com usuário e senha não é aceito.";
  if (u.port && u.port !== "443" && u.port !== "80") return "Porta não permitida.";
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return "Endereço interno não é aceito.";
  const ips = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (!ips.length) return "Esse domínio não existe ou não respondeu.";
  if (ips.some(ipPrivado)) return "Endereço interno não é aceito.";
  return u;
}

export async function fetchSeguro(raw: string, opts: { maxSaltos?: number; timeoutMs?: number; lerHtml?: boolean } = {}): Promise<FetchResult> {
  const saltos: Salto[] = [];
  let atual = raw;
  for (let i = 0; i <= (opts.maxSaltos ?? 6); i++) {
    const u = await urlSegura(atual);
    if (typeof u === "string") return { ok: false, erro: u, saltos };
    let res: Response;
    try {
      res = await fetch(u, {
        redirect: "manual",
        signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; SDM-link-check/1.0)", accept: "text/html,*/*" },
      });
    } catch {
      return { ok: false, erro: "O endereço não respondeu a tempo.", saltos };
    }
    saltos.push({ url: u.toString(), status: res.status });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      atual = new URL(loc, u).toString();
      await res.body?.cancel();
      continue;
    }
    let html: string | undefined;
    if (opts.lerHtml && (res.headers.get("content-type") ?? "").includes("text/html")) {
      html = (await res.text()).slice(0, 400_000);
    } else await res.body?.cancel();
    return { ok: true, saltos, final: u.toString(), status: res.status, html };
  }
  return { ok: false, erro: "Redirecionamentos demais.", saltos };
}
