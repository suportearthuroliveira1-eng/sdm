"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Dev = "iphone" | "android";

const noop = () => () => {};
function detect(): Dev | null {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iphone";
  if (/android/i.test(ua)) return "android";
  return null;
}

// Passos copiados do protótipo (A03).
const STEPS: Record<Dev, string[]> = {
  iphone: [
    "Abra este link no Safari.",
    "Toque no botão Compartilhar (o quadrado com a seta pra cima).",
    "Role e toque em \"Adicionar à Tela de Início\".",
    "Toque em \"Adicionar\".",
    "Abra o SDM pelo ícone novo e entre com seu e-mail.",
  ],
  android: [
    "Abra este link no Chrome.",
    "Toque nos 3 pontinhos no canto de cima.",
    "Toque em \"Instalar app\" ou \"Adicionar à tela inicial\".",
    "Confirme.",
    "Abra o SDM pelo ícone novo.",
  ],
};
const NOME: Record<Dev, string> = { iphone: "iPhone", android: "Android" };

export function InstallGuide() {
  const router = useRouter();
  const detected = useSyncExternalStore(noop, detect, () => null);
  const [choice, setChoice] = useState<Dev | null>(null);
  const dev: Dev = choice ?? detected ?? "iphone";
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const instalei = async () => {
    setBusy(true);
    const r = await fetch("/api/app/installed", { method: "POST" }).catch(() => null);
    router.push(r?.ok ? "/app" : "/app/a01");
  };

  return (
    <>
      <div role="radiogroup" aria-label="Seu celular" className="grid grid-cols-2 gap-2">
        {(["iphone", "android"] as const).map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={dev === d}
            onClick={() => setChoice(d)}
            className={`min-h-11 cursor-pointer rounded-[22px] border px-3.5 text-sm text-text ${dev === d ? "border-accent bg-sel font-bold" : "border-line-2 bg-surface"}`}
          >
            {NOME[d]}
          </button>
        ))}
      </div>

      {evt ? (
        <button
          type="button"
          className="b2"
          onClick={async () => {
            await evt.prompt();
            if ((await evt.userChoice).outcome === "accepted") await instalei();
            setEvt(null);
          }}
        >
          Instalar agora
        </button>
      ) : null}

      <ol className="m-0 flex list-none flex-col gap-3.5 p-0" aria-label={`Passos no ${NOME[dev]}`}>
        {STEPS[dev].map((t, i) => (
          <li key={t} className="cd flex-row items-center gap-3">
            <span className="dot bg-sel text-accent-2" aria-hidden>{i + 1}</span>
            <span className="tx">{t}</span>
          </li>
        ))}
      </ol>
      <div className="mu flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-[#4A4058]">[print do passo no {NOME[dev]}]</div>
      {dev === "iphone" ? <div className="warn">No iPhone, instale antes de entrar. Aviso no celular (notificação) só funciona a partir do iOS 16.4.</div> : null}
      <button type="button" className="b1" onClick={instalei} disabled={busy}>Já instalei</button>
    </>
  );
}
