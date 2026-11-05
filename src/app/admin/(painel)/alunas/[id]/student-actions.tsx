"use client";

import { useActionState, useState, useTransition } from "react";
import { newLinkAction, setEntitlementAction, setStudentActiveAction, setStudentPasswordAction, type LinkResult } from "@/lib/actions/admin";
import type { Product } from "@/lib/domain/entitlements";
import { Notice } from "@/components/ui/screen";
import { LinkBox } from "../link-box";

export function StudentActions({
  studentId,
  ativo,
  active,
  labels,
}: {
  studentId: string;
  ativo: boolean;
  active: Record<Product, boolean>;
  labels: Record<Product, string>;
}) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<LinkResult | null>(null);
  return (
    <>
      <div className="acd gap-4">
        <h2 className="font-semibold">Acessos</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(active) as Product[]).map((p) => (
            <label key={p} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-4 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input
                type="checkbox"
                defaultChecked={active[p]}
                disabled={pending}
                className="size-4 accent-[var(--accent)]"
                onChange={(e) => start(() => setEntitlementAction(studentId, p, e.target.checked))}
              />
              {labels[p]}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted">Marcar libera na hora (origem: manual). Desmarcar revoga.</p>
      </div>

      <div className="acd gap-4">
        <h2 className="font-semibold">Link de acesso</h2>
        <div className="flex flex-wrap gap-2">
          <button className="ab1" disabled={pending || !ativo} onClick={() => start(async () => setLink(await newLinkAction(studentId)))}>Gerar novo link</button>
          <button
            className={ativo ? "ab2 text-danger" : "ab2"}
            disabled={pending}
            onClick={() => {
              if (ativo && !confirm("Desativar a aluna? Ela perde o acesso e os links pendentes.")) return;
              start(() => setStudentActiveAction(studentId, !ativo));
            }}
          >
            {ativo ? "Desativar aluna" : "Reativar aluna"}
          </button>
        </div>
        {link && !link.ok ? <Notice tone="danger">{link.error}</Notice> : null}
        {link?.ok ? <LinkBox url={link.url} message={link.message} expiresAt={link.expiresAt} /> : null}
      </div>

      <PasswordBox studentId={studentId} />
    </>
  );
}

function PasswordBox({ studentId }: { studentId: string }) {
  const [state, action, pending] = useActionState(setStudentPasswordAction.bind(null, studentId), null as { ok?: boolean; error?: string } | null);
  return (
    <form action={action} className="acd gap-3">
      <h2 className="text-base font-bold">Senha da aluna</h2>
      <p className="mu text-[13px]">Defina uma senha pra ela entrar com e-mail e senha. Passe a senha pra ela por um canal seguro; ela pode trocar depois no app.</p>
      <div className="flex flex-wrap gap-2">
        <label htmlFor="nova-senha" className="sr-only">Nova senha</label>
        <input id="nova-senha" name="senha" type="text" autoComplete="off" required minLength={8} placeholder="8+ caracteres, letra e número" className="ain flex-[1_1_240px]" />
        <button className="ab1" disabled={pending}>{pending ? "Salvando..." : "Definir senha"}</button>
      </div>
      <p role="status" className="h-4 text-xs">{state?.ok ? <span className="text-ok">Senha definida.</span> : state?.error ? <span className="text-danger">{state.error}</span> : null}</p>
    </form>
  );
}
