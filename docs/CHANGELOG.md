# Changelog

## 2026-11-05 · Rota de saúde
- `src/app/api/health/route.ts`: variáveis presentes e conexão com o banco, sem expor valores. Produção: banco conectado depois do reset da senha (levou alguns minutos pra valer).

## 2026-11-05 · Deploy no Supabase e na Vercel
- Supabase: migrations e seed aplicados pela API de gerenciamento e registrados em `supabase_migrations.schema_migrations`; Auth com Site URL, redirect, sem cadastro aberto, código de 6 dígitos.
- Vercel: projeto `sdm-app` ligado ao GitHub, variáveis `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `WHATSAPP_PROVIDER`; primeiro deploy READY.
- Login por e-mail agora usa o link do e-mail padrão (fluxo implicit) + página `/auth/confirmar`; o campo de código continua pra quando houver SMTP próprio.
- `docs/DEPLOY.md` reescrito com a situação real e o que falta.
- Quebra algo existente: textos do A01 mudaram de "código" pra "link".

## 2026-11-05 · Supabase público fixo no código
- `src/lib/public-config.ts`: URL e chave publishable do projeto `hcknrrgbmhnqtmenovmk` (env com o mesmo nome tem prioridade). Usado por `env()`, `proxy.ts` e `seed-admin`.
- `ACCESS_LINK_SECRET` e `APP_URL` viraram opcionais (segredo derivado da chave secret; URL da Vercel).
- Deploy na Vercel cai pra 3 variáveis. +3 testes (25).
- Quebra algo existente: não.

## 2026-11-05 · Deploy sem terminal
- `.github/workflows/supabase.yml`: aplica migrations e seed no Supabase (manual ou quando `supabase/**` muda). Segredos: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.
- `.github/workflows/ci.yml`: typecheck, lint, testes e build.
- `supabase/config.toml` mínimo.
- 1º admin criado no 1º login com `ADMIN_EMAIL` (`src/lib/actions/auth.ts`).
- `docs/DEPLOY.md`: passo a passo pelo navegador.
- Quebra algo existente: não.

## 2026-11-05 · Protótipos, conteúdo e Supabase
- Protótipos em `docs/prototipo/` (App e Admin). Extrator corrigido (só constantes de topo, stub de DCLogic) e novo `pnpm docs:conteudo` → `db/seed-data/conteudo.json` (19 módulos, 117 aulas, 39 termos, 6 produtos, 42 blocos).
- Visual e textos do protótipo em A01, A02 (reenviar + falar com o time), A03 (passos, aviso iOS, "Já instalei"), link de acesso e admin (menu, AD01 com KPIs/jornada reais, AD02 com filtros e colunas, AD08 com o que cada acesso libera).
- Tokens de cor e utilitários CSS do protótipo (`b1`, `b2`, `b3`, `cd`, `kk`, `tx`, `mu`, `in`, `warn`, `good`...), botão voltar com histórico.
- Migrations novas: `0003_prototipo_campos` (lessons.requer_entitlements[], vitrine_products.extra), `0004_drop_requer_entitlement`, `0005_rls_sem_force`.
- Supabase: `supabase/migrations/*` (`pnpm db:supabase`) e `supabase/seed.sql` (`pnpm db:supabase-seed`), testados num Postgres com schema `extensions`.
- Testes: +7 unitários (conteúdo × protótipo), e2e atualizados (5).
- Quebra algo existente: `lessons.requer_entitlement` virou `requer_entitlements` (lista). Classes CSS antigas (`btn-*`, `card`, `field`) removidas.

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
