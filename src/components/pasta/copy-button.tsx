"use client";

import { useState } from "react";
import { toast } from "@/components/ux/toaster";

export function CopyButton({ text, label = "Copiar", className = "" }: { text: string; label?: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      className={`press inline-flex min-h-11 cursor-pointer items-center rounded-[22px] border border-line-2 bg-transparent px-3 text-xs font-semibold text-text-2 hover:bg-surface-2 ${className}`}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        toast("Copiado");
        setTimeout(() => setOk(false), 1600);
      }}
    >
      {ok ? "Copiado" : label}
    </button>
  );
}
