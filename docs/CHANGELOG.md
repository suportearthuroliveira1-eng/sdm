# Changelog

## 2026-11-05 · Fase 1 (base)
- Projeto criado: Next.js 16 + TS estrito + Tailwind 4 + Drizzle + Supabase + Inngest + Zod + Vitest + Playwright.
- Schema completo e migrations: `0000_init.sql` (tabelas, enums, sequências, pgvector), `0001_rls.sql` (RLS em todas as tabelas, funções `current_student_id`/`owns_student_product`), `0002_settings_value_nullable.sql`.
- Auth: A01 (código de 6 dígitos), A02 (sem acesso + ticket), link de acesso assinado `/acesso/[token]`, `proxy.ts` protegendo `/app` e `/admin`, login do time em `/admin/entrar`.
- Admin: layout com papéis, AD01 (contagens), AD02 (nova aluna, CSV), AD03 (acessos, link, WhatsApp, desativar), AD08 (mapa e eventos), AD11 (settings), auditoria.
- Webhooks Hubla e Hotmart (desligados por flag), `WhatsAppSender`, `TrackingProvider`, `MetricsProvider`.
- PWA: manifest, service worker, ícones, A03, página offline.
- Seeds: settings (25, pendências marcadas), agentes (10, inativos), conteúdo via `db/seed-data/conteudo.json` (ainda não existe); `seed:admin`; extrator do protótipo.
- Testes: 15 unitários, 4 e2e.
- Principais arquivos: `src/lib/db/schema.ts`, `drizzle/*`, `src/lib/auth/*`, `src/lib/server/students.ts`, `src/lib/integrations/*`, `src/app/**`.
- Quebra algo existente: não (primeira versão).
