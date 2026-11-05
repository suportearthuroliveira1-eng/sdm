import type { Metadata } from "next";
import { Screen } from "@/components/ui/screen";
import { getAuthUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Sua senha" };

/** Criar ou trocar a senha (logada). Quem entra pelo link de acesso cai aqui na 1ª vez. */
export default async function Senha({ searchParams }: PageProps<"/app/senha">) {
  const user = await getAuthUser();
  if (!user) redirect("/app/a01");
  const sp = await searchParams;
  const primeiro = sp.primeiro === "1";
  const to = typeof sp.to === "string" && sp.to.startsWith("/admin") ? "/admin" : "/app";
  return (
    <Screen id="SENHA" head={{ k: "Acesso", t: primeiro ? "Crie sua senha" : "Trocar senha" }} back={to}>
      <p className="tx">
        {primeiro ? "Pronto, você entrou. Crie uma senha pra entrar das próximas vezes só com e-mail e senha." : `Conta: ${user.email}`}
      </p>
      <PasswordForm to={to} primeiro={primeiro} />
    </Screen>
  );
}
