"use client";

import { useState } from "react";

export function LinkBox({ url, message, expiresAt }: { url: string; message: string; expiresAt: string }) {
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);
  const copy = async (what: "link" | "msg") => {
    await navigator.clipboard.writeText(what === "link" ? url : message);
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  };
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
      <p className="mb-2 text-sm text-muted">Link de acesso (uso único, vence em {new Date(expiresAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })})</p>
      <p className="mb-3 break-all font-mono text-xs">{url}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={() => copy("link")}>Copiar link</button>
        <button type="button" className="btn-ghost" onClick={() => copy("msg")}>Copiar mensagem pronta pro WhatsApp</button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 h-5 text-sm text-ok">{copied ? "Copiado" : ""}</p>
    </div>
  );
}
