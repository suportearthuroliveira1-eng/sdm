"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Platform = "ios" | "android" | "outro";

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "outro";
}

const STEPS: Record<"ios" | "android", string[]> = {
  ios: [
    "Abra este link no Safari (no Chrome do iPhone não dá).",
    "Toque no botão de compartilhar, o quadrado com a seta pra cima.",
    "Role e toque em \"Adicionar à Tela de Início\".",
    "Toque em \"Adicionar\". O ícone do SDM aparece na sua tela.",
  ],
  android: [
    "Abra este link no Chrome.",
    "Toque nos três pontinhos no canto de cima.",
    "Toque em \"Instalar app\" ou \"Adicionar à tela inicial\".",
    "Confirme. O ícone do SDM aparece na sua tela.",
  ],
};

const noop = () => () => {};

export function InstallGuide() {
  const platform = useSyncExternalStore(noop, detect, () => "outro" as Platform);
  const standalone = useSyncExternalStore(noop, () => window.matchMedia("(display-mode: standalone)").matches, () => false);
  const [tabChoice, setTab] = useState<"ios" | "android" | null>(null);
  const tab = tabChoice ?? (platform === "android" ? "android" : "ios");
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [justInstalled, setInstalled] = useState(false);
  const installed = standalone || justInstalled;

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      fetch("/api/app/installed", { method: "POST" }).catch(() => {});
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="flex flex-col gap-4">
        <p className="card text-ok">O app já está instalado neste aparelho.</p>
        <Link href="/app" className="btn-primary">Continuar</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {evt ? (
        <button
          className="btn-primary"
          onClick={async () => {
            await evt.prompt();
            const r = await evt.userChoice;
            if (r.outcome === "accepted") setInstalled(true);
            setEvt(null);
          }}
        >
          Instalar agora
        </button>
      ) : null}

      <div role="tablist" aria-label="Escolha seu celular" className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-1">
        {(["ios", "android"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-11 rounded-lg text-sm font-semibold ${tab === t ? "bg-accent text-accent-ink" : "text-muted"}`}
          >
            {t === "ios" ? "iPhone" : "Android"}
          </button>
        ))}
      </div>

      <ol className="flex flex-col gap-3" aria-label={`Passos no ${tab === "ios" ? "iPhone" : "Android"}`}>
        {STEPS[tab].map((s, i) => (
          <li key={s} className="card flex gap-4 p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">{i + 1}</span>
            <span className="pt-1">{s}</span>
          </li>
        ))}
      </ol>
      {platform === "outro" ? <p className="text-sm text-muted">Abra este endereço no celular para instalar.</p> : null}
      <Link href="/app" className="btn-ghost">Fazer depois</Link>
    </div>
  );
}
