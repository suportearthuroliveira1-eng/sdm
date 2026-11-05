import type { Metadata } from "next";
import { Screen } from "@/components/ui/screen";
import { EnterButton } from "./enter-button";

export const metadata: Metadata = { title: "Seu acesso", robots: { index: false } };

/**
 * Link de acesso (uso único, 72h). O GET só mostra o botão: a prévia do
 * WhatsApp abre o link sozinha e não pode gastar o uso único.
 */
export default async function Acesso({ params }: PageProps<"/acesso/[token]">) {
  const { token } = await params;
  return (
    <Screen id="ACESSO">
      <div className="mt-10 mb-8">
        <h1 className="text-[28px] font-bold leading-tight">Seu acesso chegou</h1>
        <p className="mt-2 text-muted">Toque em entrar. Esse link funciona uma vez e vence em 72 horas.</p>
      </div>
      <EnterButton token={token} />
    </Screen>
  );
}
