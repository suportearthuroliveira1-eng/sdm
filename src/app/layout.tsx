import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SwRegister } from "@/components/pwa/sw-register";
import { NavProgress } from "@/components/ux/nav-progress";
import { Toaster } from "@/components/ux/toaster";
import { cssDoTema } from "@/lib/domain/tema";
import { temaApp } from "@/lib/server/config-app";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SDM", template: "%s · SDM" },
  description: "Sistema Dólar Mundial · área da aluna",
  applicationName: "SDM",
  appleWebApp: { capable: true, title: "SDM", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0C13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = await temaApp();
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full antialiased`} data-animacoes={tema && !tema.animacoes ? "off" : undefined}>
      {/* Aparência do Admin → Aparência (só cores validadas #RRGGBB entram aqui) */}
      {tema ? <head><style dangerouslySetInnerHTML={{ __html: cssDoTema(tema) }} /></head> : null}
      <body className="min-h-full">
        <NavProgress />
        {children}
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
