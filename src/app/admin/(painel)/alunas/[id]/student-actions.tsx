"use client";

import { useState, useTransition } from "react";
import { newLinkAction, setEntitlementAction, setStudentActiveAction, type LinkResult } from "@/lib/actions/admin";
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
      <div className="card flex flex-col gap-4">
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

      <div className="card flex flex-col gap-4">
        <h2 className="font-semibold">Link de acesso</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" disabled={pending || !ativo} onClick={() => start(async () => setLink(await newLinkAction(studentId)))}>Gerar novo link</button>
          <button
            className={ativo ? "btn-danger" : "btn-ghost"}
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
    </>
  );
}
