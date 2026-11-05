# Estado do projeto

> Foto atual (reescrita a cada tarefa). Última atualização: **2026-11-05** · branch `claude/intelligent-bohr-54teds`.

## Fase atual
**Fase 1 · Base: ~80%.** O que falta pra fechar a Fase 1 depende dos docs do produto (seeds de conteúdo) e de um projeto Supabase real (testar o OTP e o link com Auth de verdade).

| Fase | % | Nota |
|---|---|---|
| 1 Base | 80 | infra, banco, RLS, auth manual, admin inicial, PWA, webhook desligado ✓ · seeds de conteúdo bloqueados (sem docs) |
| 2 Casca do app | 0 | |
| 3 Diagnóstico e produto | 0 | |
| 4 Funil | 0 | |
| 5 Divulgação e números | 0 | |
| 6 Dinheiro, escalar, ebook | 0 | |
| 7 Professora e suporte | 0 | tabela `support_tickets` já recebe pedidos da A02 |
| 8 Admin completo | 10 | AD01 (contagens), AD02, AD03, AD08, AD11 iniciais |
| 9 Endurecimento | 0 | |

## Bloqueio principal
**Os docs de referência não estão no repositório.** Faltam `docs/SDM_contexto_completo_v6.md`, `docs/prototipo/App.dc.html` e `docs/prototipo/Admin.dc.html` (no 1º chat veio só o prompt). Sem eles não dá pra semear as 111 aulas + B1 + PO, o glossário (32 + 7), a vitrine (6 exemplos), CKDEF/PASSOS/INFODEF, nem copiar textos e visual exatos das telas. Nada disso foi inventado.

## Telas
- **A01** ✓ login por e-mail + código de 6 dígitos (Supabase OTP); e-mail sem cadastro/sem SDM ativo → A02. Textos provisórios (conferir com protótipo).
- **A02** ✓ sem acesso + formulário de suporte (vira ticket). Textos provisórios.
- **A03** ✓ instalar (iPhone/Android, botão nativo quando o navegador oferece, marca `instalado_em`). Textos provisórios.
- **Link de acesso** `/acesso/[token]` ✓ (botão "Entrar" protege o uso único contra a prévia do WhatsApp).
- **/app** provisório: confirma acesso e leva pra A03. Vira A04/I01 na Fase 2.
- **A04–A07, I*, FR*, B*, V*, EN*, F*, T*, DV*, PG*, OG*, N*, DN*, E*, EB*, L*, Q*, U01**: não começadas.
- **Admin**: login do time ✓ · AD01 parcial (4 contagens) · AD02 ✓ (busca, nova aluna com link, importar CSV) · AD03 parcial (dados, acessos, gerar link, copiar mensagem WhatsApp, desativar; faltam conversas, pastas, impersonar) · AD08 ✓ (mapa produto→acesso, log de eventos, reprocessar) · AD11 parcial (editor JSON das settings) · AD04–AD07, AD09, AD10, AD12, AD13: não começadas.

## Pronto e testado
- Schema completo (todas as tabelas da seção 4 + `access_links`, `favorites`, `content_blocks`, `knowledge_chunks` com pgvector, `rate_limits`), IDs legíveis ALN/PRD/VIT/GEN/EVT por sequência.
- RLS em todas as tabelas (migration `0001_rls.sql`), testada num Postgres 16 local com stub do Supabase: aluna vê só a própria linha/pasta; settings invisível.
- Webhook Hubla/Hotmart: assinatura, idempotência por id do evento, log em `events`, flag desligada guarda sem processar, compra cria aluna + libera, reembolso/chargeback revogam. Testado com curl contra o banco local.
- Rate limit em Postgres (login por IP e por e-mail, conferência do código, tickets).
- Auditoria (`audit_log`) em toda ação do admin.
- PWA: manifest, service worker (shell offline + push), ícones provisórios, página offline.
- Testes: 15 unitários (Vitest) + 4 e2e (Playwright) passando. `typecheck`, `lint` e `build` limpos.

## Simulado ou provisório
- Ícones do app (marca "SDM" gerada por script) até vir a arte oficial.
- Textos das telas A01–A03 e do admin: escritos seguindo o prompt, conferir com o protótipo.
- `WhatsAppSender`: só adaptador de log. `TrackingProvider`: vazio. `MetricsProvider`: manual.
- Agentes de IA: 10 linhas em `agents`, inativas, prompt `[PENDENTE]`.
- Settings `ai_models`: `[conferir]` (a doc da OpenAI estava bloqueada pela rede do ambiente de dev).
- Webhook Hubla: nomes de evento, caminhos do payload e header `x-hubla-token` **não conferidos** na doc da Hubla.

## Quebrado / bugs conhecidos
- Nada quebrado conhecido. Não testado com Supabase real: envio do código OTP, login por link (generateLink + verifyOtp), criação de usuário de Auth.

## Próximos 3 passos
1. Colocar os docs em `docs/` → rodar `pnpm docs:extract` → montar `db/seed-data/conteudo.json` (formato em `db/seed-data/content-schema.ts`) → `pnpm db:seed`. Conferir textos/visual de A01–A03 e admin com o protótipo.
2. Criar o projeto Supabase, preencher `.env.local`, `pnpm db:migrate && pnpm db:seed && pnpm seed:admin`, ajustar o template de e-mail do Supabase pra mostrar `{{ .Token }}` e testar login por código e por link.
3. Fase 2: casca do app (5 abas, histórico, I01–I05, aulas L01–L06 com PO, desbloqueios da seção 4.4).

## Pendências que dependem de você
| Desde | Pendência |
|---|---|
| 2026-11-05 | Subir `docs/SDM_contexto_completo_v6.md` e `docs/prototipo/App.dc.html` + `Admin.dc.html` |
| 2026-11-05 | Criar projeto Supabase e preencher `.env.local` (lista em `.env.example`) |
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

## Variáveis de ambiente em uso
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ACCESS_LINK_SECRET`, `APP_URL`, `ADMIN_EMAIL`, `HUBLA_WEBHOOK_SECRET`, `HOTMART_WEBHOOK_SECRET`, `WHATSAPP_PROVIDER`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`. Declaradas e ainda sem uso: `OPENAI_API_KEY`, `TRACKING_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `RESEND_API_KEY`, `WHATSAPP_API_KEY`.
