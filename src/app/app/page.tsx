import type { Metadata } from "next";
import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { requireStudent } from "@/lib/auth/session";
import { PRODUCT_LABEL } from "@/lib/domain/entitlements";
import { isActive } from "@/lib/domain/entitlements";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Início" };

/**
 * Entrada do app. Fase 1: confirma o acesso e leva pra instalação.
 * Fase 2 troca por A04 (1º acesso) / I01 (seu caminho) com o menu de 5 abas.
 */
export default async function AppHome() {
  const { student, entitlements } = await requireStudent();
  const ativos = entitlements.filter((e) => isActive(e)).map((e) => PRODUCT_LABEL[e.produto]);
  const primeiro = student.nome.split(/\s+/)[0];
  return (
    <Screen id="APP-F1">
      <div className="mt-6 mb-6">
        <h1 className="text-[26px] font-bold leading-tight">Oi, {primeiro}</h1>
        <p className="mt-2 text-muted">Seu acesso está ativo: {ativos.join(", ")}.</p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/app/a03" className="b1">Instalar o app no celular</Link>
        <Link href="/app/senha" className="b2 no-underline">Trocar senha</Link>
        <SignOutButton />
      </div>
    </Screen>
  );
}
