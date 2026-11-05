"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`spinner ${className}`} />;
}

/** Botão de formulário com estado "carregando" automático (useFormStatus). */
export function SubmitButton({ children, pendente, className = "b1", disabled, name, value }: { children: ReactNode; pendente?: ReactNode; className?: string; disabled?: boolean; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (
        <>
          <Spinner /> {pendente ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Indicador de "carregando" pra formulários cujo botão é um cartão inteiro. */
export function FormPending({ label = "Salvando..." }: { label?: string }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <span className="mu flex items-center gap-2 text-accent-2" role="status">
      <Spinner /> {label}
    </span>
  );
}
