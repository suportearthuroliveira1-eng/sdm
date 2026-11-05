import type { Metadata } from "next";
import { Brand } from "@/components/ui/screen";
import { Confirmar } from "./confirmar";

export const metadata: Metadata = { title: "Entrando", robots: { index: false } };

/** Volta do link de entrar do e-mail do Supabase (sessão no fragmento da URL). */
export default function Page() {
  return (
    <main data-screen="AUTH-CONFIRMAR" className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-[22px] px-5 pb-7 pt-[max(env(safe-area-inset-top),34px)]">
      <div className="flex items-center gap-3">
        <Brand />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">Sistema Dólar Mundial</span>
          <span className="mu text-[13px]">com Amanda Gomes</span>
        </div>
      </div>
      <Confirmar />
    </main>
  );
}
