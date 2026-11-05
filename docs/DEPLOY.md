# Deploy · passo a passo (sem terminal)

Tudo pelo navegador. Ordem importa. Nunca cole senha ou chave secreta no chat.

## 1. Banco (Supabase) · ~5 min
1. Crie um token: https://supabase.com/dashboard/account/tokens → **Generate new token** → copie.
2. No GitHub do projeto: **Settings → Secrets and variables → Actions → New repository secret**:
   - `SUPABASE_ACCESS_TOKEN` = o token do passo 1
   - `SUPABASE_DB_PASSWORD` = a senha do banco (a que você definiu ao criar o projeto; se não lembra: Supabase → Project Settings → Database → Reset database password)
3. GitHub → aba **Actions** → **Supabase · banco** → **Run workflow**. Ficou verde = tabelas, segurança (RLS) e conteúdo (117 aulas, glossário, vitrine, textos) no ar.
4. Supabase → **Authentication → Emails → Magic Link**: troque o texto por algo como `Seu código do SDM: {{ .Token }}` e salve.
5. Supabase → **Authentication → Sign In / Providers**: desligue **Allow new users to sign up** (alunas são criadas pelo admin).

## 2. App (Vercel) · ~5 min
1. https://vercel.com/new → **Import** o repositório `sdm`. Framework: Next.js (detecta sozinho).
2. Antes de clicar em Deploy, abra **Environment Variables** e cadastre só estas 3 (URL e chave publishable do Supabase já estão fixas no código):

| Nome | Onde pegar |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → **secret** (`sb_secret_...`) |
| `DATABASE_URL` | Supabase → botão **Connect** (topo) → **Transaction pooler** (porta 6543), trocando `[YOUR-PASSWORD]` pela senha do banco |
| `ADMIN_EMAIL` | seu e-mail (vira admin no 1º login) |

Opcionais: `APP_URL` (só se usar domínio próprio), `ACCESS_LINK_SECRET` (sem ele o app deriva um da chave secret).

3. **Deploy**.
4. Supabase → **Authentication → URL Configuration** → **Site URL** = o endereço do app na Vercel (ex.: `https://sdm.vercel.app`).

## 3. Primeiro acesso
1. Abra `https://<seu-app>/admin/entrar`, digite o `ADMIN_EMAIL`, pegue o código no e-mail.
2. Em **AD02 Alunas → Nova aluna**, crie uma aluna teste com seu outro e-mail, **Copiar link**, abra no celular, toque em **Entrar no app**.
3. Teste também `https://<seu-app>/app/a01` com o e-mail da aluna (código por e-mail).

## Depois (quando tiver)
`OPENAI_API_KEY`, `RESEND_API_KEY`, `VAPID_*`, `INNGEST_*`, `HUBLA_WEBHOOK_SECRET`, `TRACKING_API_KEY`, `WHATSAPP_API_KEY`: cadastre na Vercel e faça **Redeploy**.

## Observações
- O e-mail padrão do Supabase manda poucas mensagens por hora (limite do plano grátis). Pra muitas alunas, configure um SMTP próprio (ex.: Resend) em Authentication → Emails → SMTP Settings.
- Mudou o banco no código? O workflow **Supabase · banco** roda sozinho no push.
