import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Screen } from "@/components/ui/screen";

export const metadata: Metadata = { title: "Entrar" };

// A01 · Login. Textos finais: conferir com docs/prototipo/App.dc.html.
export default function A01() {
  return (
    <Screen id="A01">
      <div className="mt-10 mb-8">
        <h1 className="text-[28px] font-bold leading-tight">Entre no seu app</h1>
        <p className="mt-2 text-muted">Use o e-mail da sua compra. A gente manda um código de 6 dígitos, sem senha.</p>
      </div>
      <LoginForm mode="aluna" />
    </Screen>
  );
}
