import type { Metadata } from "next";
import { Screen } from "@/components/ui/screen";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function Cadastro() {
  return (
    <Screen id="CADASTRO" head={{ k: "Acesso", t: "Criar conta" }} back="/app/a01">
      <p className="tx">Use o e-mail da sua compra e crie uma senha. Não precisa de código.</p>
      <SignupForm />
    </Screen>
  );
}
