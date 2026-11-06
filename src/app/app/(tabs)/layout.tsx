import { AppShell } from "@/components/app/app-shell";
import { getAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { passoPendente } from "@/lib/domain/onboarding";
import { configFluxo } from "@/lib/server/config-app";

export default async function TabsLayout({ children }: LayoutProps<"/app">) {
  const [{ student }, admin, fluxo] = await Promise.all([requireStudent(), getAdmin(), configFluxo()]);
  // Primeiro acesso obrigatório (Admin → Fluxo do app): sem terminar, não entra no app.
  if (fluxo.onboardingObrigatorio && !admin) {
    const falta = passoPendente(student, fluxo);
    if (falta) redirect(falta);
  }
  return (
    <AppShell nome={student.nome} isAdmin={Boolean(admin)}>
      {children}
    </AppShell>
  );
}
