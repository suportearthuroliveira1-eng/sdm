# SDM · App da aluna e painel admin

PWA do Sistema Dólar Mundial. Veja `CLAUDE.md` (resumo e regras) e `docs/ESTADO.md` (onde o projeto está).

## Subir o banco no Supabase (uma vez, do seu computador)
Precisa da [CLI do Supabase](https://supabase.com/docs/guides/cli). Na pasta do projeto:
```bash
supabase login
```
```bash
supabase init
```
(se perguntar, pode responder "não" pras opções de VS Code/Deno)
```bash
supabase link --project-ref hcknrrgbmhnqtmenovmk
```
```bash
supabase db push --include-seed
```
Isso cria todas as tabelas, o RLS e semeia configurações, agentes, módulos, aulas, glossário, vitrine de exemplo e textos.

Depois, no painel do Supabase:
1. **Authentication → Email Templates → Magic Link**: troque o corpo para incluir o código, por exemplo `Seu código do SDM: {{ .Token }}`.
2. **Authentication → Sign In / Providers → Email**: deixe ligado; "Allow new users to sign up" pode ficar **desligado** (as alunas são criadas pelo admin).

## Setup local
1. Node 22 + pnpm 10. `pnpm install`.
2. Copie `.env.example` para `.env.local` e preencha (nunca commite).
3. Crie o 1º admin: `pnpm seed:admin` (usa `ADMIN_EMAIL`).
4. `pnpm dev` e entre em `/admin/entrar` com o `ADMIN_EMAIL`.

### Mudou o schema?
`pnpm db:generate` (gera drizzle/NNNN.sql) → `pnpm db:supabase` (copia pra supabase/migrations) → `supabase db push`.
Mudou o conteúdo do protótipo? `pnpm docs:extract && pnpm docs:conteudo`, semeie um banco local e rode `SEED_DB_URL=... pnpm db:supabase-seed`.

### Testar sem Supabase (Postgres 16 + pgvector local)
```bash
psql "$DATABASE_URL" -f scripts/test-db/supabase-stub.sql
```
```bash
pnpm db:migrate && pnpm db:seed
```

## Deploy
- **Supabase:** ver "Subir o banco no Supabase" acima.
- **Vercel:** importe o repositório, cadastre as variáveis do `.env.example` em Settings → Environment Variables. `APP_URL` = domínio final.
- **Inngest Cloud:** conecte o app em `/api/inngest` e cadastre `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY`.
- **Webhooks:** Hubla → `https://<app>/api/webhooks/hubla` (segredo em `HUBLA_WEBHOOK_SECRET`). Ligar em AD11 (`auth_hubla_webhook`) só depois de mapear os produtos em AD08.

## Editar conteúdo pelo admin
- Alunas e acessos: `/admin/alunas`.
- Mapa de produtos e eventos de compra: `/admin/acessos`.
- Flags, nomes de modelo, limites e pendências: `/admin/config`.
- Aulas, vitrine, agentes, textos e bancos da semana: próximas fases (AD04–AD07, AD10).
