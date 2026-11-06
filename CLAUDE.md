# SDM · App da aluna + Admin

**Antes de qualquer tarefa, leia `docs/ESTADO.md`. Ao terminar qualquer tarefa, atualize `docs/ESTADO.md` e `docs/CHANGELOG.md`** (e `docs/DECISOES.md` se for decisão grande). Commit junto com o código (`docs: atualiza estado`). Se o `git log` for mais novo que o ESTADO, confira o código e corrija o ESTADO antes de seguir.

Leia também `AGENTS.md`: o Next.js aqui é a 16 e mudou muito (`proxy.ts` no lugar de middleware, `PageProps`/`LayoutProps` globais, docs em `node_modules/next/dist/docs/`).

## O que é
App instalável (PWA) do **SDM (Sistema Dólar Mundial)** para alunas da Amanda Gomes. A aluna é **afiliada**: escolhe produto da vitrine, pega o link de afiliada e divulga (pago ou orgânico). O app tem área de membros (111 aulas + B1 + PO), IA (kit, anúncios, roteiros, professora), gerador de imagem, gerador de ebook e painel admin completo.
Fonte única de produto: `docs/SDM_contexto_completo_v6.md` (ainda não chegou). **Fluxo atual: `docs/App_SDM_Fluxo_Ideal.pdf`** (dois caminhos: afiliada do SDM e produto próprio com IA; vale acima do protótipo onde divergem). Telas e textos: `docs/prototipo/App.dc.html` e `Admin.dc.html`. Pedido original: `docs/PROMPT_ORIGINAL.md`.

## Stack e comandos
Next.js 16 (App Router) + TypeScript estrito + Tailwind 4 · Supabase (Postgres, Auth, Storage, RLS, pgvector) · Drizzle · Inngest · OpenAI (só servidor) · @react-pdf/renderer · web-push · Zod · Vitest + Playwright · Vercel.

```
pnpm install
pnpm dev                 # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm test
pnpm test:e2e            # app rodando; E2E_BASE_URL, PW_CHROMIUM=/opt/pw-browsers/chromium no container
pnpm db:generate         # depois de mudar src/lib/db/schema.ts (renomear coluna: gerar em 2 passos, sem TTY)
pnpm db:supabase         # copia drizzle/*.sql -> supabase/migrations (produção: supabase db push)
pnpm db:migrate          # aplica drizzle/*.sql no DATABASE_URL (banco LOCAL de teste)
pnpm db:seed             # settings, agentes e db/seed-data/conteudo.json
pnpm db:supabase-seed    # gera supabase/seed.sql a partir de um banco local semeado (SEED_DB_URL)
pnpm seed:admin          # 1º admin com ADMIN_EMAIL
pnpm docs:extract        # protótipo -> db/seed-data/prototipo-raw.json
pnpm docs:conteudo       # prototipo-raw.json -> db/seed-data/conteudo.json
pnpm inngest:dev         # jobs locais
```
Deploy: Vercel (app) + Supabase (banco/storage, projeto `hcknrrgbmhnqtmenovmk`, migrations via `supabase db push --include-seed`) + Inngest Cloud. Ver README.
O container de dev NÃO alcança *.supabase.co nem openai.com (política de rede): teste com o Postgres local (`service postgresql start`, banco `sdm_test`, stub em scripts/test-db).

## Regras que nunca mudam
1. A aluna é afiliada. Página de vendas e checkout são do produtor.
2. O app **não cria nem hospeda página de vendas**: a IA entrega o kit, o app ensina a montar na ferramenta externa (`PAGE_TOOL_NAME`) e confere a página publicada (F06).
3. Ebook = módulo "Produto próprio · Ebook", abre depois da 1ª venda (flag `feature_ebook_unlock`).
4. A IA não vende, não conversa com comprador e não publica nada sem a aluna aprovar.
5. Toda resposta da aluna salva na hora e vai pra frente no fluxo. Nunca pedir duas vezes.
6. **Nunca inventar número, depoimento, prova ou resultado.** Faltou dado: `[valor]`, `[—]` ou o que vier do admin.
7. **Chaves secretas só no `.env.local` / Vercel.** Nunca em código, commit, log ou mensagem. OpenAI só no servidor. Exceções pedidas pela dona: URL e chave **publishable** do Supabase (públicas) ficam fixas em `src/lib/public-config.ts`; chaves de serviço editáveis no admin (ex.: `OPENAI_API_KEY`) ficam na tabela `app_secrets` (só servidor, RLS sem política) via **Admin → Chaves e variáveis**, lidas por `segredo()` em `src/lib/server/segredos.ts` (banco → env).
8. Visual do protótipo: fundo `#0E0C13`, superfície `#17141F`, destaque `#A98BFF`, Plus Jakarta Sans, toque ≥ 44px, sem emoji, AA, mobile-first 390px.
9. Interface em pt-BR. Conteúdo pro comprador no idioma de venda, sempre com tradução pra aluna.
10. Nomes de modelo de IA são configuração (settings `ai_models`), nunca fixos no código.

## Mapa
```
src/app/app/(primeiro)/  primeiro acesso: a04 boas-vindas, a07 combinado, a05 diagnóstico, a06 resultado, caminho
src/app/app/(tabs)/      app logado com menu (AppShell): Início, v01 Produtos, l01 Aulas, q01 Professora, u01 Perfil
src/app/app/(tabs)/p/[id]/[etapa]  pastas dos caminhos (sdm | proprio) e divulgação; slug da etapa em src/lib/domain/etapas.ts
src/app/app/<id>/        demais telas pelo ID do protótipo (a01, v02, v05 e f02/f04/dv01 pras pastas da vitrine)
src/app/admin/(painel)/  telas AD01–AD13 + Personalizar: fluxo, diagnostico, ia, chaves (layout checa papel); admin/entrar = login do time
src/app/acesso/[token]   link de acesso (uso único, 72h)
src/app/api/             webhooks (hubla, hotmart), inngest, app/*
src/proxy.ts             renova sessão Supabase e barra /app e /admin sem login
src/lib/db/schema.ts     schema Drizzle (todas as tabelas) · drizzle/ migrations (0001 = RLS)
src/lib/auth/            sessão da aluna, admin/papéis, link assinado
src/lib/domain/          regras puras e testáveis (entitlements, etapas, diagnostico/decidir, onboarding, config-schemas, ...)
src/lib/server/          serviços de servidor (alunas, settings, config-app, segredos, auditoria, rate limit, log)
src/lib/actions/         server actions (auth, admin)
src/lib/integrations/    webhooks, WhatsAppSender, TrackingProvider, MetricsProvider
src/lib/ai/              IA: regras base, agentes (tarefa + schema Zod), rodar() com cache/custo, professora
src/lib/gen/             motor modelo SDM (sem IA), textos, imagem
src/lib/inngest/         client e funções de job
db/seed-data/            settings, agentes, schema do conteúdo, conteudo.json (gerado do protótipo)
supabase/                migrations (cópia gerada de drizzle/) e seed.sql — não editar à mão
scripts/                 seeds, extrator do protótipo, ícones, stub do Supabase pra teste local
tests/unit · e2e/        Vitest · Playwright
docs/                    ESTADO, CHANGELOG, DECISOES, contexto e protótipo
```
