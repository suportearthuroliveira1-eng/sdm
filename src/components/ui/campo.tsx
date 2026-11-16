"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icone, type NomeIcone } from "./icone";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & { icone?: NomeIcone; classe?: string };

/** Campo com ícone à esquerda (e-mail, nome...). */
export function CampoIcone({ icone, classe = "in min-h-[52px]", ...rest }: Props) {
  return (
    <span className="relative block">
      {icone ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icone nome={icone} tamanho={18} /></span> : null}
      <input {...rest} className={`${classe} ${icone ? "pl-11" : ""}`} />
    </span>
  );
}

/** Campo de senha: cadeado à esquerda e botão de mostrar/esconder à direita. */
export function CampoSenha({ classe = "in min-h-[52px]", placeholder = "Sua senha", ...rest }: Omit<Props, "type" | "icone">) {
  const [ver, setVer] = useState(false);
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icone nome="cadeado" tamanho={18} /></span>
      <input {...rest} type={ver ? "text" : "password"} placeholder={placeholder} className={`${classe} pl-11 pr-12`} />
      <button
        type="button"
        onClick={() => setVer(!ver)}
        aria-label={ver ? "Esconder o que digitei" : "Mostrar o que digitei"}
        aria-pressed={ver}
        className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-text"
      >
        <Icone nome={ver ? "olhoFechado" : "olho"} tamanho={18} />
      </button>
    </span>
  );
}
