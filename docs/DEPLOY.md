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
2. Antes de clicar em Deploy, abra **Environment Variables** e cadastre:

| Nome | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hcknrrgbmhnqtmenovmk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → **publishable** |
| `SUPABASE_SERVICE_ROLE_KEY` | mesma tela → **secret** (`sb_secret_...`) |
| `DATABASE_URL` | Supabase → botão **Connect** (topo) → **Transaction pooler** (porta 6543), trocando `[YOUR-PASSWORD]` pela senha |
| `ACCESS_LINK_SECRET` | 48 caracteres aleatórios (gerador de senha, sem espaços) |
| `APP_URL` | o endereço da Vercel, ex.: `https://sdm-xxxx.vercel.app` (sem barra no fim; pode ajustar depois do 1º deploy e fazer Redeploy) |
| `ADMIN_EMAIL` | seu e-mail (vira admin no 1º login) |
| `WHATSAPP_PROVIDER` | `log` |

3. **Deploy**.
4. Supabase → **Authentication → URL Configuration** → **Site URL** = o mesmo `APP_URL`.

## 3. Primeiro acesso
1. Abra `APP_URL/admin/entrar`, digite o `ADMIN_EMAIL`, pegue o código no e-mail.
2. Em **AD02 Alunas → Nova aluna**, crie uma aluna teste com seu outro e-mail, **Copiar link**, abra no celular, toque em **Entrar no app**.
3. Teste também `APP_URL/app/a01` com o e-mail da aluna (código por e-mail).

## Depois (quando tiver)
`OPENAI_API_KEY`, `RESEND_API_KEY`, `VAPID_*`, `INNGEST_*`, `HUBLA_WEBHOOK_SECRET`, `TRACKING_API_KEY`, `WHATSAPP_API_KEY`: cadastre na Vercel e faça **Redeploy**.

## Observações
- O e-mail padrão do Supabase manda poucas mensagens por hora (limite do plano grátis). Pra muitas alunas, configure um SMTP próprio (ex.: Resend) em Authentication → Emails → SMTP Settings.
- Mudou o banco no código? O workflow **Supabase · banco** roda sozinho no push.
