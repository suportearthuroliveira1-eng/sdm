"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Menu do admin (protótipo Admin.dc.html). Telas ainda não construídas aparecem desabilitadas com a fase. */
export const ADMIN_SCREENS: { id: string; label: string; href?: string; fase?: string }[] = [
  { id: "AD01", label: "Visão geral", href: "/admin" },
  { id: "AD02", label: "Alunas", href: "/admin/alunas" },
  { id: "AFIL", label: "Pedidos de afiliação", href: "/admin/afiliacao" },
  { id: "KIT", label: "Kit do SDM", href: "/admin/kit" },
  { id: "AD04", label: "Agentes de IA", fase: "Fase 8" },
  { id: "AD05", label: "Aulas", fase: "Fase 8" },
  { id: "AD06", label: "Vitrine", fase: "Fase 8" },
  { id: "AD07", label: "Bancos da semana", fase: "Fase 8" },
  { id: "AD08", label: "Acessos e webhooks", href: "/admin/acessos" },
  { id: "AD09", label: "Relatório semanal", fase: "Fase 8" },
  { id: "AD10", label: "Conteúdo do app", fase: "Fase 8" },
  { id: "AD11", label: "Configurações", href: "/admin/config" },
  { id: "CHAVES", label: "Chaves e variáveis", href: "/admin/chaves" },
  { id: "AD12", label: "Custos de IA", fase: "Fase 8" },
  { id: "AD13", label: "Suporte", fase: "Fase 7" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <>
      {ADMIN_SCREENS.map((s) => {
        const on = s.href && (s.href === "/admin" ? path === "/admin" : path.startsWith(s.href));
        if (!s.href)
          return (
            <span key={s.id} aria-disabled="true" title={`Entra na ${s.fase}`} className="flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-[10px] px-3 text-sm text-muted/60">
              {s.id} · {s.label}
              <span className="text-[10px]">{s.fase}</span>
            </span>
          );
        return (
          <Link
            key={s.id}
            href={s.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-[10px] px-3 text-sm no-underline ${on ? "bg-sel font-bold text-text" : "text-muted hover:text-text"}`}
          >
            {s.id} · {s.label}
          </Link>
        );
      })}
    </>
  );
}
