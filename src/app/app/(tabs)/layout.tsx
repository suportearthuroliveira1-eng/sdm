import { AppShell } from "@/components/app/app-shell";
import { getAdmin } from "@/lib/auth/admin";
import { requireStudent } from "@/lib/auth/session";

export default async function TabsLayout({ children }: LayoutProps<"/app">) {
  const [{ student }, admin] = await Promise.all([requireStudent(), getAdmin()]);
  return (
    <AppShell nome={student.nome} isAdmin={Boolean(admin)}>
      {children}
    </AppShell>
  );
}
