import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Screen } from "@/components/ui/screen";

export const metadata: Metadata = { title: "Admin · Entrar", robots: { index: false } };

export default function AdminLogin() {
  return (
    <Screen id="AD-LOGIN">
      <div className="mt-10 mb-8">
        <h1 className="text-[26px] font-bold">Painel SDM</h1>
        <p className="mt-2 text-muted">Acesso do time com e-mail e senha. Primeira vez? Crie a conta em /app/cadastro com o mesmo e-mail ou entre pelo link de acesso.</p>
      </div>
      <LoginForm mode="admin" />
    </Screen>
  );
}
