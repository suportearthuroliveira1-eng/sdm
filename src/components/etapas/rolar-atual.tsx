"use client";

import { useEffect } from "react";

/** Rola a trilha de passos até o passo atual (no celular a lista passa da tela). */
export function RolarAtual() {
  useEffect(() => {
    document.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);
  return null;
}
