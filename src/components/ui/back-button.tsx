"use client";

import { useRouter } from "next/navigation";

/** Voltar respeitando o histórico; sem histórico vai pro fallback. */
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (window.history.length > 1 && document.referrer.startsWith(window.location.origin) ? router.back() : router.push(fallback))}
      className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-surface"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4F1F8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}
