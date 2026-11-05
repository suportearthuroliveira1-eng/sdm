import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin SDM" }, robots: { index: false } };

const NAV = [
  { href: "/admin", id: "AD01", label: "Visão geral" },
  { href: "/admin/alunas", id: "AD02", label: "Alunas" },
  { href: "/admin/acessos", id: "AD08", label: "Acessos e webhooks" },
  { href: "/admin/config", id: "AD11", label: "Configurações" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-surface lg:min-h-dvh lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm font-bold tracking-[0.2em] text-accent">SDM ADMIN</span>
          <span className="text-xs text-muted">{admin.papel}</span>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm hover:bg-surface-2">
              <span className="text-xs text-muted">{n.id}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-5 py-4 lg:block">
          <p className="mb-3 truncate text-xs text-muted">{admin.email}</p>
          <SignOutButton to="/admin/entrar" />
        </div>
      </aside>
      <main className="px-5 py-6 lg:px-10">{children}</main>
    </div>
  );
}
