import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/ui/screen";

export const metadata: Metadata = { title: "Entrar" };

// A01 · Login com e-mail e senha (decisão do Fellipe, 2026-11-05: sem código por e-mail).
export default function A01() {
  return (
    <main data-screen="A01" className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-[22px] px-5 pb-7 pt-[max(env(safe-area-inset-top),34px)]">
      <div className="flex items-center gap-3">
        <Brand />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-bold">Sistema Dólar Mundial</span>
          <span className="mu text-[13px]">com Amanda Gomes</span>
        </div>
      </div>
      <div className="mt-[18px] flex flex-col gap-2.5">
        <h1 className="m-0 text-[30px] font-bold leading-[1.15]">Seu caminho pra ganhar em dólar, um passo por dia</h1>
        <p className="tx text-base text-muted">Você não precisa saber nada de internet. Aqui tudo é explicado antes, e você faz junto com a Amanda.</p>
      </div>
      <div className="mt-auto flex flex-col gap-2.5">
        <LoginForm mode="aluna" />
        <div className="grid grid-cols-2 gap-2">
          <Link href="/app/a02" className="b3">Não recebi meu acesso</Link>
          <Link href="/app/a03" className="b3">Instalar no celular</Link>
        </div>
      </div>
    </main>
  );
}
