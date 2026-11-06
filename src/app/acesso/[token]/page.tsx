import type { Metadata } from "next";
import { Brand } from "@/components/ui/screen";
import { EnterButton } from "./enter-button";
import { marcaApp } from "@/lib/server/marca";

export const metadata: Metadata = { title: "Seu acesso", robots: { index: false } };

/**
 * Link de acesso (uso único, 72h). O GET só mostra o botão: a prévia do
 * WhatsApp abre o link sozinha e não pode gastar o uso único.
 */
export default async function Acesso({ params }: PageProps<"/acesso/[token]">) {
  const { token } = await params;
  const marca = await marcaApp();
  return (
    <main data-screen="ACESSO" className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-[22px] px-5 pb-7 pt-[max(env(safe-area-inset-top),34px)]">
      <div className="flex items-center gap-3">
        <Brand src={marca.icone} />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">Sistema Dólar Mundial</span>
          <span className="mu text-[13px]">com {marca.nomeAmanda ?? "Amanda Gomes"}</span>
        </div>
      </div>
      <div className="mt-[18px] flex flex-col gap-2.5">
        <h1 className="m-0 text-[30px] font-bold leading-[1.15]">Seu acesso chegou</h1>
        <p className="tx text-base text-muted">Toque em entrar. Esse link funciona uma vez e vale por 72 horas.</p>
      </div>
      <div className="mt-auto">
        <EnterButton token={token} />
      </div>
    </main>
  );
}
