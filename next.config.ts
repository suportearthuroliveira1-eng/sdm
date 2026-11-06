import type { NextConfig } from "next";

// cacheComponents desligado de propósito: o app é quase todo autenticado e
// dinâmico. Ver docs/DECISOES.md (ADR-002).
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Upload de imagem por server action (a Vercel aceita até 4,5 MB por requisição).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  // fontes do PDF do ebook (lidas do disco na função da Vercel)
  outputFileTracingIncludes: { "/api/ebook/*": ["./public/fonts/**/*"] },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      // o PDF do ebook aparece dentro do app (prévia), só no próprio site
      { source: "/api/ebook/:path*", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] },
    ];
  },
};

export default nextConfig;
