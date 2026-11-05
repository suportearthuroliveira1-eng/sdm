# SDM · App da aluna e painel admin

PWA do Sistema Dólar Mundial. Veja `CLAUDE.md` (resumo e regras) e `docs/ESTADO.md` (onde o projeto está).

## Setup local
1. Node 22 + pnpm 10. `pnpm install`.
2. Copie `.env.example` para `.env.local` e preencha (nunca commite).
   - `ACCESS_LINK_SECRET`: 32+ caracteres aleatórios (`openssl rand -base64 48`).
   - `DATABASE_URL`: connection string do Supabase (Settings → Database; use a porta 6543/pooler na Vercel).
3. Banco: `pnpm db:migrate && pnpm db:seed && pnpm seed:admin`.
4. No Supabase → Authentication → Email Templates → Magic Link: inclua `{{ .Token }}` no corpo para a aluna receber o código de 6 dígitos.
5. `pnpm dev` e entre em `/admin/entrar` com o `ADMIN_EMAIL`.

### Testar sem Supabase (só banco)
Postgres 16 + pgvector local:
```
psql "$DATABASE_URL" -f scripts/test-db/supabase-stub.sql
pnpm db:migrate && pnpm db:seed
```

## Deploy
- **Supabase:** crie o projeto, rode as migrations (`pnpm db:migrate` com o `DATABASE_URL` de produção).
- **Vercel:** importe o repositório, cadastre as variáveis do `.env.example` em Settings → Environment Variables. `APP_URL` = domínio final.
- **Inngest Cloud:** conecte o app em `/api/inngest` e cadastre `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY`.
- **Webhooks:** Hubla → `https://<app>/api/webhooks/hubla` (segredo em `HUBLA_WEBHOOK_SECRET`). Ligar em AD11 (`auth_hubla_webhook`) só depois de mapear os produtos em AD08.

## Editar conteúdo pelo admin
- Alunas e acessos: `/admin/alunas`.
- Mapa de produtos e eventos de compra: `/admin/acessos`.
- Flags, nomes de modelo, limites e pendências: `/admin/config`.
- Aulas, vitrine, agentes, textos e bancos da semana: próximas fases (AD04–AD07, AD10).
