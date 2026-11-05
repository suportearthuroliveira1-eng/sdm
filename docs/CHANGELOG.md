# Changelog

## 2026-11-05 · Afiliação em análise e conexão do banco
- Teste em produção achou a tela presa em "Enviando o pedido..." (o pedido salvava, a resposta não voltava; login também travou 2 vezes seguidas e depois voltou ao normal). Causa provável: conexão morta com o pooler numa instância da Vercel que acordou. `src/lib/db/index.ts` ganhou `idle_timeout`, `max_lifetime` e `connect_timeout`.
- `AcaoIa` mostra erro em vez de girar pra sempre se a ação falhar.
- Afiliação em análise não segura mais a aluna: Início leva pra "Conta pra receber" (link e kit esperam a aprovação; conta e regras já abrem). A tela de afiliação ganhou "Seguir pra Conta pra receber". Teste novo (42).

## 2026-11-05 · Fluxo ideal (PDF), IA real e movimento
- **UX**: `NavProgress` (barra no clique), `loading.tsx` com esqueleto, `template.tsx` com fade, botões/cartões que reagem ao toque, `SubmitButton`/`FormPending` com spinner, `Toaster`.
- **Primeiro acesso** `src/app/app/(primeiro)/`: a04, a07, a05 (8 perguntas, salva a cada resposta), a06 (IA ou regras), caminho (cria a pasta).
- **Início** com próximo passo único e "Meu caminho" (7 fases). **Produtos** com pastas por tipo, "+ Criar produto com a IA", "Quero ser afiliada do SDM".
- **Pastas** `/app/p/[id]` e `/app/p/[id]/[etapa]`: caminho A (afiliada SDM), caminho B (produto próprio com ideias, ficha, oferta, ebook+PDF, revisão, página, checkout, teste), divulgação (pago/orgânico, base, pixel, perfil, números).
- **IA** `src/lib/ai/`: regras base, 13 agentes com schema Zod, `rodar()` com cache (`ai_cache`), checagem que refaz 1x, custo e cota; geração de anúncios/ganchos/roteiros/bio usa IA quando ligada.
- **Professora** `/api/professora` (streaming, print, histórico, cita aula); chamado pro time.
- **Link da bio** `/l/[código]` com contagem de cliques (sem robôs, sem repetição no minuto).
- **Admin**: Pedidos de afiliação e Kit do SDM.
- Migrations `0006_fluxo_ideal` (students.boas_vindas_em/diagnostico_em/caminho; student_products.tipo/nome/dados/divulgacao; kit_pieces; ai_cache) e `0007_rls_novas`, já aplicadas em produção. Settings `ai_models` (conferidos), `ai_prices`, `quota_ia_dia`.
- Correções achadas no teste com IA: trava de etapas em cadeia; efeito que devolvia a promessa de `scrollIntoView` (quebrava a Professora no Chrome novo).
- Quebra algo existente: `/app` agora leva pras boas-vindas no primeiro acesso; pastas da vitrine seguem nas telas antigas.

## 2026-11-05 · Pasta do produto: criar, gerar, criativos e imagens
- Telas: V05, V06, V07, V08, F02, F04, DV01, V09; V02 cria a pasta; V01 lista as pastas.
- `src/lib/gen/modelo.ts` (motor modelo SDM, porte do GEN/LG/PT do protótipo) + `texto.ts`; `src/lib/gen/ia.ts` (OpenAI imagem, desligado sem chave).
- `src/lib/actions/pasta.ts` (criar pasta, país, testar link, funil, gerar, aprovar, excluir, editar anúncio, cartão, enviar/gerar/excluir imagem).
- `src/lib/server/safe-fetch.ts` (SSRF), `storage.ts` (bucket privado `sdm`, URLs assinadas), `pasta.ts` (dona da pasta, etapas).
- `/api/criativo/[id]`: PNG do anúncio (1:1, 4:5, 9:16) com cor ou imagem de fundo.
- `next.config.ts`: `serverActions.bodySizeLimit` 4.5mb.
- Testes: 34 unitários, 6 e2e; fluxo inteiro conferido em produção.
- Quebra algo existente: não.

## 2026-11-05 · App logado com abas (celular e web)
- `AppShell` em `src/app/app/(tabs)/layout.tsx`: menu de 5 abas embaixo no celular, menu lateral + cabeçalho na web, link pro admin; admin ganhou "Ver o app da aluna".
- Telas: I01, L01, L02, L04, V01, V02, Q01 (aviso), U01, com dados reais do banco (`src/lib/server/aluna.ts`).
- `src/lib/domain/unlock.ts` (trilha, 1ª venda, PO) e `screens.ts` + testes (29). `src/lib/actions/aulas.ts` marca aula vista / "Agora faça" feito.
- CSS: cor de link em `@layer base` (antes passava por cima das classes).
- Dados: 2 contas full (aluna com todos os acessos + admin) com senha temporária, registradas na auditoria.
- Quebra algo existente: `/app` deixou de ser a página provisória.

## 2026-11-05 · Login com e-mail e senha
- A01 e /admin/entrar: e-mail + senha (`signInWithPassword`). Sem código, sem e-mail. Página `/auth/confirmar` removida.
- `/app/cadastro`: criar conta livre (cria usuário confirmado pelo servidor + aluna + SDM), controlado por `settings.cadastro_aberto` (novo, padrão true, já criado em produção).
- `/app/senha`: criar/trocar senha; o link de acesso redireciona pra cá na 1ª vez.
- AD03: admin define a senha da aluna. ADMIN_EMAIL vira admin no 1º login (agora em `getAdmin`).
- `src/lib/domain/password.ts` + testes (27 unitários, 6 e2e).
- Quebra algo existente: o login por código/link no e-mail deixou de existir.

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
