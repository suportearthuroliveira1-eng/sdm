import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/app/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAdmin } from "@/lib/auth/admin";
import { requireStudent } from "@/lib/auth/session";
import { isActive, PRODUCT_DESC, PRODUCTS } from "@/lib/domain/entitlements";

export const metadata: Metadata = { title: "Perfil" };

// U01 · Perfil (protótipo): dados, trilha, acessos, instalar, sair. Diagnóstico e trilha editáveis: Fases 2–3.
export default async function U01() {
  const [{ student, entitlements }, admin] = await Promise.all([requireStudent(), getAdmin()]);
  const trilha = student.trilhaPago && student.trilhaOrg ? "Pago + orgânico" : student.trilhaPago ? "Pago" : student.trilhaOrg ? "Orgânico" : "a escolher (aula 5.6)";
  const dados: [string, string][] = [
    ["E-mail", student.email],
    ["WhatsApp", student.whatsapp ?? "—"],
    ["País onde mora", student.paisMora ?? "—"],
    ["Trilha", trilha],
  ];
  return (
    <>
      <PageTitle>Perfil</PageTitle>
      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3.5">
            <span aria-hidden className="flex size-[60px] flex-none items-center justify-center rounded-full bg-[#3B2F5C] text-[22px] font-bold">{student.nome.charAt(0).toUpperCase()}</span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-lg font-bold">{student.nome}</span>
              <span className="mu truncate text-[13px]">{student.email}</span>
              <span className="mu">{student.code}</span>
            </span>
          </div>
          <dl className="m-0 flex flex-col rounded-2xl bg-surface">
            {dados.map(([l, v]) => (
              <div key={l} className="flex justify-between gap-3 border-b border-line-3 px-3.5 py-3 text-[13px] last:border-0">
                <dt className="mu text-[13px]">{l}</dt>
                <dd className="m-0 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-3.5">
          <span className="lb">Meus acessos</span>
          <ul className="m-0 flex list-none flex-col rounded-2xl bg-surface p-0">
            {PRODUCTS.map((p) => {
              const on = entitlements.some((e) => e.produto === p && isActive(e));
              return (
                <li key={p} className="flex justify-between gap-3 border-b border-line-3 px-3.5 py-3 text-[13px] last:border-0">
                  <span>{PRODUCT_DESC[p].nome}</span>
                  <span className={`font-bold ${on ? "text-ok" : "text-muted"}`}>{on ? "Ativo" : "—"}</span>
                </li>
              );
            })}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/app/senha" className="b2 no-underline">Trocar senha</Link>
            <Link href="/app/a03" className="b2 no-underline">Instalar na tela</Link>
          </div>
          {admin ? <Link href="/admin" className="b2 no-underline">Abrir o painel admin</Link> : null}
          <SignOutButton className="b3 self-start text-[#F6C9D1]" />
        </div>
      </div>
    </>
  );
}
