"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Menu do admin (protótipo Admin.dc.html). Telas ainda não construídas aparecem desabilitadas com a fase. */
export const ADMIN_SCREENS: { id: string; label: string; href?: string; fase?: string; grupo: string }[] = [
  { id: "AD01", label: "Visão geral", href: "/admin", grupo: "Operação" },
  { id: "AD02", label: "Alunas", href: "/admin/alunas", grupo: "Operação" },
  { id: "AFIL", label: "Pedidos de afiliação", href: "/admin/afiliacao", grupo: "Operação" },
  { id: "KIT", label: "Kit do SDM", href: "/admin/kit", grupo: "Operação" },
  { id: "AD08", label: "Acessos e webhooks", href: "/admin/acessos", grupo: "Operação" },
  { id: "AD05", label: "Aulas e trilhas", href: "/admin/aulas", grupo: "Operação" },
  { id: "SECRETO", label: "País Oculto", href: "/admin/pais-oculto", grupo: "Operação" },
  { id: "TIME", label: "Time do admin", href: "/admin/time", grupo: "Operação" },
  { id: "FLUXO", label: "Fluxo e textos", href: "/admin/fluxo", grupo: "Personalizar" },
  { id: "DIAG", label: "Diagnóstico e decisão", href: "/admin/diagnostico", grupo: "Personalizar" },
  { id: "AD04", label: "Inteligência artificial", href: "/admin/ia", grupo: "Personalizar" },
  { id: "APAR", label: "Aparência", href: "/admin/aparencia", grupo: "Personalizar" },
  { id: "MARCA", label: "Marca e foto da Amanda", href: "/admin/marca", grupo: "Personalizar" },
  { id: "CHAVES", label: "Chaves e variáveis", href: "/admin/chaves", grupo: "Personalizar" },
  { id: "AD11", label: "Todas as configurações", href: "/admin/config", grupo: "Personalizar" },
  { id: "AD06", label: "Vitrine", fase: "em breve", grupo: "Em breve" },
  { id: "AD07", label: "Bancos da semana", fase: "em breve", grupo: "Em breve" },
  { id: "AD09", label: "Relatório semanal", fase: "em breve", grupo: "Em breve" },
  { id: "AD12", label: "Custos de IA", fase: "em breve", grupo: "Em breve" },
  { id: "AD13", label: "Suporte", fase: "em breve", grupo: "Em breve" },
];

export function AdminNav() {
  const path = usePathname();
  const grupos = [...new Set(ADMIN_SCREENS.map((s) => s.grupo))];
  return (
    <>
      {grupos.map((g) => (
        <div key={g} className="flex shrink-0 gap-0.5 lg:mb-3 lg:flex-col">
          <span className="hidden px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted/70 lg:block">{g}</span>
      {ADMIN_SCREENS.filter((s) => s.grupo === g).map((s) => {
        const on = s.href && (s.href === "/admin" ? path === "/admin" : path.startsWith(s.href));
        if (!s.href)
          return (
            <span key={s.id} aria-disabled="true" title={`Entra na ${s.fase}`} className="flex min-h-11 shrink-0 items-center justify-between gap-2 rounded-[10px] px-3 text-sm text-muted/60">
              {s.label}
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
            {s.label}
          </Link>
        );
      })}
        </div>
      ))}
    </>
  );
}
