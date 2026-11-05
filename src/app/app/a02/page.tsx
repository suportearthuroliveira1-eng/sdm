import type { Metadata } from "next";
import Link from "next/link";
import { Screen } from "@/components/ui/screen";
import { SupportForm } from "./support-form";

export const metadata: Metadata = { title: "Sem acesso" };

// A02 · Sem acesso (reenviar acesso + suporte).
export default function A02() {
  return (
    <Screen id="A02" back="/app/a01">
      <div className="mt-6 mb-6">
        <h1 className="text-[26px] font-bold leading-tight">Não achamos seu acesso</h1>
        <p className="mt-2 text-muted">
          Confira se é o mesmo e-mail que você usou na compra. Se for e mesmo assim não entrar, mande uma mensagem pro time: a gente libera à mão.
        </p>
      </div>
      <Link href="/app/a01" className="btn-ghost mb-6">Tentar com outro e-mail</Link>
      <SupportForm />
    </Screen>
  );
}
