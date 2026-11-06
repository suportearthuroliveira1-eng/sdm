import { requireStudent } from "@/lib/auth/session";

/** Ações com IA (ficha, oferta, capítulos) podem levar 10–40 s: sem isso a Vercel corta antes. */
export const maxDuration = 60;

/** Primeiro acesso: telas sem o menu de abas, uma coisa por vez. */
export default async function PrimeiroLayout({ children }: LayoutProps<"/app">) {
  await requireStudent();
  return <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col gap-4 px-5 pb-10 pt-[max(env(safe-area-inset-top),24px)]">{children}</main>;
}
