"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TabIcons } from "./icons";

export const TABS = [
  { href: "/app", id: "I01", label: "Início", icon: TabIcons.inicio },
  { href: "/app/v01", id: "V01", label: "Produtos", icon: TabIcons.produtos },
  { href: "/app/l01", id: "L01", label: "Aulas", icon: TabIcons.aulas },
  { href: "/app/oculto", id: "OC", label: "Ocultos", icon: TabIcons.oculto },
  { href: "/app/q01", id: "Q01", label: "Professora", icon: TabIcons.professora },
  { href: "/app/u01", id: "U01", label: "Perfil", icon: TabIcons.perfil },
] as const;

// Seções de cada aba (pra marcar a aba certa em subtelas, ex.: /app/l02 é de Aulas).
const SECAO: [RegExp, string][] = [
  [/^\/app\/(p\/|v0[2-9]|f0|en|t0|dv|pg|og|n0|dn|e0|eb)/, "/app/v01"],
  [/^\/app\/l0/, "/app/l01"],
  [/^\/app\/q0/, "/app/q01"],
  [/^\/app\/u0/, "/app/u01"],
];

function tabAtiva(path: string) {
  for (const t of TABS) if (path === t.href) return t.href;
  for (const [re, href] of SECAO) if (re.test(path)) return href;
  return "/app";
}

/**
 * Moldura do app logado.
 * Celular (< lg): conteúdo + menu de 5 abas embaixo (só nas telas raiz, como no protótipo);
 *   subtelas mostram cabeçalho com voltar.
 * Computador (≥ lg): menu lateral fixo + cabeçalho com o título da tela e a aluna.
 */
export function AppShell({ nome, isAdmin, marca = {}, children }: { nome: string; isAdmin: boolean; marca?: { fotoAmanda?: string; icone?: string; nomeAmanda?: string }; children: ReactNode }) {
  const path = usePathname();
  const ativa = tabAtiva(path);
  const raiz = TABS.some((t) => t.href === path);
  const inicial = nome.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[248px_1fr]">
      {/* menu lateral (computador) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1.5 border-r border-line bg-side px-4 py-6 lg:flex">
        <Link href="/app" className="mb-5 flex items-center gap-2.5 px-2 no-underline">
          {marca.icone ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={marca.icone} alt="" aria-hidden className="size-10 rounded-xl object-cover" />
          ) : (
            <span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-accent text-[13px] font-bold text-accent-ink">SDM</span>
          )}
          <span className="flex flex-col">
            <span className="text-sm font-bold text-text">Sistema Dólar Mundial</span>
            <span className="mu flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {marca.fotoAmanda ? <img src={marca.fotoAmanda} alt="" aria-hidden className="size-5 rounded-full object-cover" /> : null}
              com {marca.nomeAmanda ?? "Amanda Gomes"}
            </span>
          </span>
        </Link>
        <nav aria-label="Menu principal" className="flex flex-col gap-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={ativa === t.href ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm no-underline ${ativa === t.href ? "bg-sel font-bold text-text" : "text-muted hover:bg-surface hover:text-text"}`}
            >
              <span className={t.id === "OC" ? "text-c-amber" : undefined}>{t.icon}</span>
              {t.id === "OC" ? "Países Ocultos" : t.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link href="/admin" className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm text-accent-2 no-underline hover:bg-surface">
              {TabIcons.admin}
              Painel admin
            </Link>
          ) : null}
        </nav>
        <Link href="/app/u01" className="mt-auto flex items-center gap-3 rounded-xl px-2 py-2 no-underline hover:bg-surface">
          <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-[#3B2F5C] text-sm font-bold text-text">{inicial}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-text">{nome}</span>
            <span className="mu block">Ver perfil</span>
          </span>
        </Link>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* cabeçalho (computador) */}
        <header className="sticky top-0 z-10 hidden h-16 items-center justify-between border-b border-line bg-bg/90 px-10 backdrop-blur lg:flex">
          <span className="text-sm text-muted">{TABS.find((t) => t.href === ativa)?.label}</span>
          <span className="flex items-center gap-3 text-sm">
            <span className="text-muted">Oi, {nome.split(/\s+/)[0]}</span>
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-[#3B2F5C] text-xs font-bold">{inicial}</span>
          </span>
        </header>

        {/* cabeçalho com voltar (celular, subtelas) */}
        {!raiz ? <MobileBack /> : null}

        <main className={`mx-auto w-full max-w-[430px] flex-1 px-5 pt-3 lg:max-w-[1040px] lg:px-10 lg:pt-8 ${raiz ? "pb-28" : "pb-10"} lg:pb-12`}>
          {children}
        </main>

        {/* menu de baixo (celular, telas raiz) */}
        {raiz ? (
          <nav aria-label="Menu principal" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-line bg-side px-1 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 lg:hidden">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={ativa === t.href ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] no-underline ${ativa === t.href ? "font-bold text-text" : "text-muted"}`}
              >
                <span className={t.id === "OC" ? "text-c-amber" : undefined}>{t.icon}</span>
                {t.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function MobileBack() {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 px-5 pt-4 lg:hidden">
      <button
        type="button"
        aria-label="Voltar"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/app"))}
        className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-surface"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4F1F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
    </div>
  );
}
