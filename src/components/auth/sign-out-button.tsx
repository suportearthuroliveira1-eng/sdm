"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton({ to = "/app/a01", className = "b2" }: { to?: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOut();
          router.replace(to);
        })
      }
    >
      Sair
    </button>
  );
}
