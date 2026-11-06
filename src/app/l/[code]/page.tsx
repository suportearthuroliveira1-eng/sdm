import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { destinoDaBio, type BioPagina } from "@/lib/server/bio";
import { rateLimit } from "@/lib/server/rate-limit";

export const metadata: Metadata = { robots: { index: false } };

const TXT = {
  en: { botao: "Get it now", mais: "More links", vazio: "This page is being set up." },
  es: { botao: "Lo quiero", mais: "Más enlaces", vazio: "Esta página está en preparación." },
  pt: { botao: "Quero o meu", mais: "Mais links", vazio: "Esta página está sendo preparada." },
} as const;
const IDIOMA: Record<string, keyof typeof TXT> = { eua: "en", uk: "en", latam: "es", esp: "es", br: "pt" };

/** Página de links da bio (pública): nome, frase, botão do produto e links extras. Conta a visita. */
export default async function PaginaBio({ params, searchParams }: PageProps<"/l/[code]">) {
  const { code } = await params;
  if (!/^[a-z0-9_-]{4,20}$/i.test(code)) notFound();
  const p = await db().query.studentProducts.findFirst({ where: eq(schema.studentProducts.bioCode, code.toLowerCase()) });
  if (!p) notFound();
  const [aluna, bioIa] = await Promise.all([
    db().query.students.findFirst({ where: eq(schema.students.id, p.studentId), columns: { nome: true } }),
    db().query.generatedItems.findFirst({ where: and(eq(schema.generatedItems.studentProductId, p.id), eq(schema.generatedItems.tipo, "bio")), orderBy: desc(schema.generatedItems.createdAt) }),
  ]);
  const cfg = ((p.dados ?? {}) as { bioPagina?: BioPagina }).bioPagina ?? {};
  const t = TXT[IDIOMA[p.paisVenda ?? ""] ?? "en"];
  const destino = destinoDaBio(p);
  const nome = cfg.nome || aluna?.nome?.split(/\s+/)[0] || p.nome || "";
  const frase = cfg.frase || (bioIa?.conteudo as { bio?: { x?: string } } | undefined)?.bio?.x || "";
  const links = (cfg.links ?? []).filter((l) => /^https?:\/\//.test(l.url));

  // conta a visita (sem robô, sem repetir a mesma pessoa no mesmo minuto)
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const sp = await searchParams;
  const bot = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|discord|telegram/i.test(ua);
  if (!bot && (await rateLimit(`bio:${p.id}:${createHash("sha256").update(ip + ua).digest("hex").slice(0, 16)}`, 1, 60)).ok) {
    await db()
      .insert(schema.linkClicks)
      .values({ studentProductId: p.id, rede: String(sp.r ?? "").slice(0, 30) || null, post: String(sp.p ?? "").slice(0, 60) || null, uaHash: createHash("sha256").update(ua).digest("hex").slice(0, 32) })
      .catch(() => {});
  }

  return (
    <main className="min-h-dvh px-5 py-12" style={{ background: "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 22%, var(--bg)), var(--bg) 60%)" }}>
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center gap-5 text-center">
        <span className="grid size-24 place-items-center rounded-full border-4 border-surface bg-accent text-4xl font-extrabold text-accent-ink shadow-2xl">{nome.slice(0, 1).toUpperCase()}</span>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-2xl font-extrabold">{nome}</h1>
          {frase ? <p className="m-0 whitespace-pre-line text-[15px] leading-relaxed text-text-2">{frase}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3">
          {destino ? (
            <a href={`/l/${code}/ir`} className="press flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-5 text-base font-extrabold text-accent-ink no-underline shadow-[0_10px_30px_-10px_var(--accent)]">
              {cfg.botao || t.botao}
            </a>
          ) : null}
          {links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="press flex min-h-14 w-full items-center justify-center rounded-2xl border border-line-2 bg-surface px-5 text-[15px] font-bold text-text no-underline hover:border-accent">
              {l.texto}
            </a>
          ))}
          {!destino && !links.length ? <p className="mu">{t.vazio}</p> : null}
        </div>
      </div>
    </main>
  );
}
