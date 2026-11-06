import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "./nav";

/** Ações com IA (ficha, oferta, capítulos) podem levar 10–40 s: sem isso a Vercel corta antes. */
export const maxDuration = 60;

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin SDM" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-wrap bg-bg">
      <nav aria-label="Menu do admin" className="box-border flex min-w-[200px] max-w-[260px] flex-[1_1_220px] flex-col gap-1.5 border-r border-line bg-side px-4 py-6 max-lg:max-w-none max-lg:flex-[1_1_100%] max-lg:flex-row max-lg:overflow-x-auto max-lg:border-b max-lg:border-r-0">
        <div className="flex shrink-0 items-center gap-2.5 px-2 pb-[18px] max-lg:pb-0">
          <span aria-hidden className="flex size-9 items-center justify-center rounded-[10px] bg-accent text-xs font-bold text-accent-ink">SDM</span>
          <span className="flex flex-col">
            <span className="text-sm font-bold">Admin</span>
            <span className="mu">Perfil: {admin.papel}</span>
          </span>
        </div>
        <AdminNav />
        <div className="mt-auto flex shrink-0 flex-col gap-2 px-2 pt-6 max-lg:mt-0 max-lg:pt-0">
          <span className="mu truncate max-lg:hidden">{admin.email}</span>
          <a href="/app" className="ab2 no-underline">Ver o app da aluna</a>
          <SignOutButton to="/admin/entrar" className="ab2" />
        </div>
      </nav>
      <main className="box-border flex min-w-0 flex-[999_1_640px] flex-col gap-5 px-8 pb-10 pt-7 max-sm:px-4">{children}</main>
    </div>
  );
}
