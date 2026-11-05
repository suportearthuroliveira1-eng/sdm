# Estado do projeto

> Foto atual (reescrita a cada tarefa). Última atualização: **2026-11-05 (5ª tarefa: deploy no Supabase e na Vercel)** · branch `claude/intelligent-bohr-54teds`.

## Fase atual
**Fase 1 · Base: ~95%.** Banco no Supabase pronto (migrations + seed) e app na Vercel (`sdm-app`, deploy automático do GitHub). Falta a dona: `DATABASE_URL` na Vercel e testar o login. Endereço público: https://sdm-app.vercel.app (ver `docs/DEPLOY.md`).

| Fase | % | Nota |
|---|---|---|
| 1 Base | 90 | infra, banco, RLS, auth manual, admin inicial, PWA, webhook desligado, seeds do protótipo ✓ · falta validar no Supabase real |
| 2 Casca do app | 0 | |
| 3 Diagnóstico e produto | 0 | |
| 4 Funil | 0 | |
| 5 Divulgação e números | 0 | |
| 6 Dinheiro, escalar, ebook | 0 | |
| 7 Professora e suporte | 0 | tabela `support_tickets` já recebe pedidos da A02 |
| 8 Admin completo | 15 | AD01 (KPIs e jornada reais), AD02 (filtros do protótipo), AD03, AD08, AD11 iniciais |
| 9 Endurecimento | 0 | |

## Bloqueio principal
- **Contexto v6 ainda não chegou** (`docs/SDM_contexto_completo_v6.md`). Os protótipos chegaram em 2026-11-05 e já estão em `docs/prototipo/`. Do contexto ainda faltam: roteiro de 5 blocos de cada aula (seção 6), regras de conteúdo dos agentes (seção 10), regras de desbloqueio detalhadas (4.4), mapa de funil (3.1), campos (8), métricas (12) e pendências (13).
- **Produção bloqueada por 2 itens da dona**: `DATABASE_URL` (senha do banco nunca foi enviada; criar um usuário de banco novo foi barrado pelas permissões do ambiente). (`sdm-app.vercel.app` já é público; Supabase Site URL aponta pra ele.)

## Telas
- **A01** ✓ visual e textos do protótipo; login por e-mail: o Supabase manda um link (`/auth/confirmar`, fluxo implicit, funciona em outro aparelho); se houver SMTP com `{{ .Token }}`, o código de 6 dígitos também vale; sem cadastro/sem SDM ativo → A02. Única diferença do protótipo: a nota "você entra direto" virou "a gente manda um código" (decisão do prompt, seção 3).
- **A02** ✓ protótipo: "Reenviar meu acesso" (e-mail + WhatsApp) e "Falar com o time". Reenvio manda link novo pro WhatsApp **cadastrado** se `whatsapp_auto_send` e o provedor existirem; senão vira ticket. Resposta igual nos dois casos (não revela cadastro).
- **A03** ✓ protótipo (5 passos iPhone/Android, aviso iOS 16.4, "Já instalei" marca `instalado_em` e o "Agora faça" da aula 0.1). Print do passo: placeholder até o admin subir as imagens (AD10).
- **Link de acesso** `/acesso/[token]` ✓ (botão "Entrar" protege o uso único contra a prévia do WhatsApp).
- **/app** provisório: confirma acesso e leva pra A03. Vira A04/I01 na Fase 2.
- **A04–A07, I*, FR*, B*, V*, EN*, F*, T*, DV*, PG*, OG*, N*, DN*, E*, EB*, L*, Q*, U01**: não começadas.
- **Admin** (visual do Admin.dc.html): login do time ✓ · AD01 ✓ 6 KPIs + jornada de 10 passos com contagens reais do banco (abandono e dúvidas: placeholders até Fases 2/7) · AD02 ✓ (busca, filtros Todas/Sem acesso 7 dias/Sem funil/Com venda, colunas do protótipo; "Onde está" = [—] até as etapas existirem; nova aluna com link, importar CSV) · AD03 parcial (dados, acessos, gerar link, copiar mensagem WhatsApp, desativar; faltam conversas, pastas, impersonar) · AD08 ✓ (o que cada acesso libera, mapa produto→acesso, log de eventos, reprocessar) · AD11 parcial (editor JSON das settings) · AD04–AD07, AD09, AD10, AD12, AD13: não começadas.

## Pronto e testado
- Schema completo (todas as tabelas da seção 4 + `access_links`, `favorites`, `content_blocks`, `knowledge_chunks` com pgvector, `rate_limits`), IDs legíveis ALN/PRD/VIT/GEN/EVT por sequência.
- RLS em todas as tabelas (migration `0001_rls.sql`), testada num Postgres 16 local com stub do Supabase: aluna vê só a própria linha/pasta; settings invisível.
- Webhook Hubla/Hotmart: assinatura, idempotência por id do evento, log em `events`, flag desligada guarda sem processar, compra cria aluna + libera, reembolso/chargeback revogam. Testado com curl contra o banco local.
- Rate limit em Postgres (login por IP e por e-mail, conferência do código, tickets).
- Auditoria (`audit_log`) em toda ação do admin.
- PWA: manifest, service worker (shell offline + push), ícones provisórios, página offline.
- **Conteúdo do protótipo no banco**: 19 módulos, 117 aulas (111 + B1 + PO.1–PO.5, PO libera com UP1 ou D1), 39 termos (32 oficiais + 7 do app), 6 produtos da vitrine (marcados `exemplo`, códigos VIT do protótipo), 42 blocos de texto (CKDEF, PASSOS, INFODEF, ENT, HEAD, DIAG, PAISES, LG).
- `supabase/migrations` + `supabase/seed.sql` testados num Postgres com cara de Supabase (schema `extensions`, aplicar 2x o seed não duplica).
- Build passa sem nenhuma variável de ambiente (pronto pra Vercel).
- `/api/health`: diz se as variáveis existem e se o banco conecta (só o tipo do erro, sem valores).
- Testes: 25 unitários (Vitest, incluindo conferência do conteúdo contra o protótipo) + 5 e2e (Playwright). `typecheck`, `lint` e `build` limpos.

## Simulado ou provisório
- Ícones do app (marca "SDM" gerada por script) até vir a arte oficial.
- Roteiros de 5 blocos das aulas: vazios (vêm do contexto v6).
- Comissão dos produtos da vitrine: vazia (`[valor]` no protótipo).
- `WhatsAppSender`: só adaptador de log. `TrackingProvider`: vazio. `MetricsProvider`: manual.
- Agentes de IA: 10 linhas em `agents`, inativas, prompt `[PENDENTE]`.
- Settings `ai_models`: `[conferir]` (a doc da OpenAI estava bloqueada pela rede do ambiente de dev).
- Webhook Hubla: nomes de evento, caminhos do payload e header `x-hubla-token` **não conferidos** na doc da Hubla.

## Quebrado / bugs conhecidos
- Produção: `DATABASE_URL` cadastrada, mas o banco recusa a senha (`28P01 password authentication failed`, visto em https://sdm-app.vercel.app/api/health). Login e admin dão erro 500 até corrigir a senha. Login por e-mail e por link de acesso ainda não testados de ponta a ponta no Supabase real.

## Próximos 3 passos
1. **Você**: `docs/DEPLOY.md` → "Falta": `DATABASE_URL` na Vercel, Redeploy, revogar tokens; depois testar `/admin/entrar` e o link de acesso de uma aluna teste.
2. Fase 2: casca do app (5 abas Início/Produtos/Aulas/Professora/Perfil, cabeçalho com histórico, A04–A07, I01–I05, L01–L06 com PO e cadeado, cartões, combinado, grupo, ferramentas FR01–FR04, base B01–B04, perfil U01, desbloqueios), seguindo o protótipo tela a tela.
3. Quando o contexto v6 chegar: roteiros de 5 blocos, regras dos agentes (seção 10) e conferência das regras de desbloqueio (4.4).

## Pendências que dependem de você
| Desde | Pendência |
|---|---|
| 2026-11-05 | Subir `docs/SDM_contexto_completo_v6.md` (protótipos já chegaram) |
| 2026-11-05 | `DATABASE_URL` na Vercel (reset da senha do banco) + Redeploy (`docs/DEPLOY.md`) |
| 2026-11-05 | Revogar os tokens Supabase/Vercel e rodar (roll) a chave secret do Supabase: foram colados no chat |
| 2026-11-05 | SMTP próprio no Supabase (e-mail padrão: 2/hora; sem ele não dá pra pôr o código no e-mail) |
| 2026-11-05 | Cadastrar na Vercel só 3 variáveis: `SUPABASE_SERVICE_ROLE_KEY` (secret), `DATABASE_URL` (pooler, com a senha do banco) e `ADMIN_EMAIL`. A senha do banco e a chave secret nunca foram enviadas (no chat veio `[YOUR-PASSWORD]`) e não vão pro código |
| 2026-11-05 | Liberar `hcknrrgbmhnqtmenovmk.supabase.co` na rede do ambiente cloud (opcional: aí eu testo o login daqui) |
| 2026-11-05 | No Supabase: Auth → Email Templates → "Magic Link": incluir `{{ .Token }}` pra o código de 6 dígitos aparecer |
| 2026-11-05 | Liberar acesso de rede a platform.openai.com (ou conferir você) pra fixar os modelos mais baratos e preços em `ai_models` |
| 2026-11-05 | Doc/exemplo de payload do webhook da Hubla (nomes de evento e header de autenticação) |
| 2026-11-05 | Contexto seção 13: ferramenta de página (`PAGE_TOOL_NAME`), links dos modelos do SDM, comissão CPA ou %, rede de afiliação, validação da 1ª venda, grupo interno/externo, provedor de WhatsApp, serviço de rastreamento (`TRACKING_API_KEY`) |
| 2026-11-05 | Valores de regra: verba mínima, regras de pausa, escada de escala, dias de aprendizado e aquecimento, frequência de posts, cotas de IA, teto de custo |
| 2026-11-05 | Arte oficial do ícone do app |

## Decisões tomadas (uma linha cada)
- Next 16 com `cacheComponents` desligado: app quase todo autenticado/dinâmico (ADR-002).
- Rotas da aluna = ID da tela em minúsculo sob `/app` (`/app/a01`).
- Banco acessado pelo servidor via Drizzle (`DATABASE_URL`), sempre filtrando pela aluna da sessão; RLS como segunda barreira pro cliente com anon key (ADR-003).
- Link de acesso = JWT HS256 + `jti` em `access_links` (uso único atômico); sessão criada com `generateLink` + `verifyOtp` no servidor (ADR-004).
- Página do link pede um toque antes de valer (prévia do WhatsApp não gasta o uso único).
- Gerar link novo revoga os anteriores não usados; desativar aluna revoga todos.
- Webhook com flag desligada responde 202 e guarda o evento (dá pra reprocessar quando ligar).
- Rate limit no Postgres, sem serviço extra (ADR-005).
- Settings com valor `null` = "ainda não definido" (pendência visível no AD11).
- Conteúdo vem do protótipo por script (`docs:extract` → `docs:conteudo`), nunca digitado à mão (ADR-007).
- Aulas PO: `requer_entitlements` é lista (UP1 **ou** D1).
- Produção aplica migrations com a CLI do Supabase (`supabase/migrations`, cópia gerada de `drizzle/`) (ADR-008).
- RLS sem FORCE: dono das tabelas/service role ignoram RLS, anon/authenticated não (migration 0005).
- pgvector no schema `extensions` no Supabase.
- A02 "Reenviar" nunca manda pro número digitado, só pro cadastrado.
- Deploy do banco por GitHub Actions (`.github/workflows/supabase.yml`), porque o container de dev não alcança o Supabase e a dona do projeto prefere não usar terminal. CI (`ci.yml`) roda typecheck, lint, testes e build em todo push.
- 1º admin nasce no 1º login com `ADMIN_EMAIL` (sem precisar de `pnpm seed:admin`).
- URL e chave publishable do Supabase fixas no código (`src/lib/public-config.ts`), a pedido; env com o mesmo nome tem prioridade (ADR-009).
- `ACCESS_LINK_SECRET` opcional (HMAC da chave secret); `APP_URL` opcional (domínio de produção da Vercel).
- Login por e-mail via link (fluxo implicit) porque o plano grátis não deixa editar o template sem SMTP (ADR-010).
- Produção: Supabase us-west-2, pooler `aws-1-us-west-2.pooler.supabase.com:6543`; Vercel projeto `sdm-app` (prod branch = `claude/intelligent-bohr-54teds`).

## Variáveis de ambiente em uso
Obrigatórias no deploy: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_EMAIL`. Com padrão: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (fixos no código), `ACCESS_LINK_SECRET` (derivado), `APP_URL` (Vercel), `WHATSAPP_PROVIDER` (`log`). Em uso se existirem: `HUBLA_WEBHOOK_SECRET`, `HOTMART_WEBHOOK_SECRET`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`. Declaradas e ainda sem uso: `OPENAI_API_KEY`, `TRACKING_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `RESEND_API_KEY`, `WHATSAPP_API_KEY`. GitHub Actions: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.
