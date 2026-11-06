import type { MetadataRoute } from "next";
import { marcaApp } from "@/lib/server/marca";

/** Lê o ícone do Admin → Marca a cada pedido (não fica congelado no build). */
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { icone } = await marcaApp();
  const tipo = icone?.endsWith(".jpg") ? "image/jpeg" : icone?.endsWith(".webp") ? "image/webp" : "image/png";
  return {
    id: "/app",
    name: "SDM · Sistema Dólar Mundial",
    short_name: "SDM",
    description: "Área da aluna do SDM",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0E0C13",
    theme_color: "#0E0C13",
    lang: "pt-BR",
    icons: [
      ...(icone ? [{ src: icone, sizes: "512x512", type: tipo }, { src: icone, sizes: "192x192", type: tipo }, { src: icone, sizes: "512x512", type: tipo, purpose: "maskable" as const }] : []),
      ...(icone ? [] : [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" as const }]),
    ],
  };
}
