# Estado do projeto

> Foto atual (reescrita a cada tarefa). Última atualização: **2026-11-05 (8ª tarefa: fluxo da pasta do produto, geração e criativos)** · branch `claude/intelligent-bohr-54teds`.

## Fase atual
**Fase 1 · Base: ~98%.** Banco no Supabase pronto (migrations + seed) e app na Vercel (`sdm-app`, deploy automático do GitHub). Falta a dona: `DATABASE_URL` na Vercel e testar o login. Endereço público: https://sdm-app.vercel.app (ver `docs/DEPLOY.md`).

| Fase | % | Nota |
|---|---|---|
| 1 Base | 90 | infra, banco, RLS, auth manual, admin inicial, PWA, webhook desligado, seeds do protótipo ✓ · falta validar no Supabase real |
| 2 Casca do app | 40 | moldura com 5 abas (menu de baixo no celular, lateral + cabeçalho na web), I01, L01, L02 (sem vídeo), L04, V01, V02 (sem filtros), Q01 (aviso), U01, desbloqueios ✓ · faltam A04–A07, I02–I05, FR*, B*, L03/L05/L06, cartões, combinado |
| 3 Diagnóstico e produto | 55 | pasta (V02→V05), V06 ficha + cartão, V07 país, V08 link com teste real, V09 biblioteca ✓ · faltam A05/A06 diagnóstico, V03/V04 recomendação, filtros e favoritos da vitrine |
| 4 Funil | 40 | F02 escolha (pré-venda/quiz/direto), F04 kit com tradução, copiar e quiz jogável ✓ · faltam F05 "monte comigo", F06 conferência da página, F07 teste até o checkout, link da bio `/l/[código]` |
| 5 Divulgação e números | 25 | DV01: 3 anúncios por vez (editar, aprovar, PNG 1:1/4:5/9:16 com cor ou imagem), 10 ganchos, 10 roteiros, bio/legenda/chamadas, imagens (envio pro Storage; geração com IA pronta, desligada sem chave) ✓ · faltam trilhas T01–T03, PG03–PG08, OG01/OG03–OG09, números N00–N04, rotina com push |
| 6 Dinheiro, escalar, ebook | 0 | |
| 7 Professora e suporte | 0 | tabela `support_tickets` já recebe pedidos da A02 |
| 8 Admin completo | 15 | AD01 (KPIs e jornada reais), AD02 (filtros do protótipo), AD03, AD08, AD11 iniciais |
| 9 Endurecimento | 0 | |

## Bloqueio principal
- **Contexto v6 ainda não chegou** (`docs/SDM_contexto_completo_v6.md`). Os protótipos chegaram em 2026-11-05 e já estão em `docs/prototipo/`. Do contexto ainda faltam: roteiro de 5 blocos de cada aula (seção 6), regras de conteúdo dos agentes (seção 10), regras de desbloqueio detalhadas (4.4), mapa de funil (3.1), campos (8), métricas (12) e pendências (13).
- **Produção bloqueada por 2 itens da dona**: `DATABASE_URL` (senha do banco nunca foi enviada; criar um usuário de banco novo foi barrado pelas permissões do ambiente). (`sdm-app.vercel.app` já é público; Supabase Site URL aponta pra ele.)

## Telas
- **A01** ✓ visual do protótipo; login com **e-mail e senha** (sem código, decisão do Fellipe em 2026-11-05) + botão "Criar conta".
- **Cadastro** `/app/cadastro` ✓ nome, e-mail, senha (8+, letra e número); sem confirmação por e-mail; com `cadastro_aberto`=true já libera SDM. E-mail que já existe não pode ser cadastrado de novo (proteção contra tomar conta alheia).
- **Senha** `/app/senha` ✓ criar/trocar senha logada; o link de acesso leva pra cá na 1ª vez.
- **A02** ✓ protótipo: "Reenviar meu acesso" (e-mail + WhatsApp) e "Falar com o time". Reenvio manda link novo pro WhatsApp **cadastrado** se `whatsapp_auto_send` e o provedor existirem; senão vira ticket. Resposta igual nos dois casos (não revela cadastro).
- **A03** ✓ protótipo (5 passos iPhone/Android, aviso iOS 16.4, "Já instalei" marca `instalado_em` e o "Agora faça" da aula 0.1). Print do passo: placeholder até o admin subir as imagens (AD10).
- **Link de acesso** `/acesso/[token]` ✓ (botão "Entrar" protege o uso único contra a prévia do WhatsApp).
- **Moldura do app** ✓ (`src/components/app/app-shell.tsx`): celular = menu de 5 abas embaixo só nas telas raiz e voltar nas subtelas (protótipo); web (≥1024px) = menu lateral fixo + cabeçalho + link "Painel admin" pra quem é admin.
- **I01** ✓ próximo passo (próxima aula liberada), próxima aula, "Agora faça" pendentes, progresso, atalhos (só pra telas que existem), plantão (placeholder).
- **L01** ✓ progresso, continuar, módulos por parte com cadeado e motivo (trilha, 1ª venda, PO = UP1/D1). **L02** ✓ aula + "Agora faça" (botão só se a tela existe) + marcar vista/feito; vídeo e roteiro: placeholder até o AD05. **L04** ✓ glossário.
- **V01** ✓ lista as pastas (abre o painel). **V02** ✓ vitrine do banco + "Divulgar este produto" (cria a pasta) / "Abrir minha pasta"; sem filtros/favoritos.
- **V05** ✓ painel da pasta com etapas 0–6, a atual destacada e o motivo de cada bloqueio. Etapas 4–6 (números, dinheiro, escalar): ainda não construídas.
- **V06** ✓ ficha automática + cartão "ajuda quem". **V07** ✓ país (sugere os do idioma do produto; trocar marca `precisa_refazer`). **V08** ✓ teste real do link (servidor, redirecionamentos, sem IP interno, rate limit); domínio da rede: `[rede a definir no admin]`.
- **F02** ✓ 3 funis com textos do protótipo e o indicado. **F04** ✓ kit (7 blocos pré-venda / 3 perguntas + resultado no quiz), aba tradução, copiar por bloco, prompt de imagem, "responda como cliente", aprovar, gerar de novo. F05/F06/F07: aviso até definirem `PAGE_TOOL_NAME` e os modelos.
- **DV01** ✓ anúncios, ganchos, roteiros, bio/legenda, imagens (enviar até 4 MB, gerar com IA se houver chave), fundo dos criativos, PNG pronto. **V09** ✓ biblioteca com filtro por tipo, copiar, aprovar, excluir.
- **Q01** aviso "professora chega numa próxima atualização" (Fase 7). **U01** ✓ dados, acessos, trocar senha, instalar, painel admin, sair.
- **A04–A07, I*, FR*, B*, V*, EN*, F*, T*, DV*, PG*, OG*, N*, DN*, E*, EB*, L*, Q*, U01**: não começadas.
- **Admin** (visual do Admin.dc.html): login do time ✓ · AD01 ✓ 6 KPIs + jornada de 10 passos com contagens reais do banco (abandono e dúvidas: placeholders até Fases 2/7) · AD02 ✓ (busca, filtros Todas/Sem acesso 7 dias/Sem funil/Com venda, colunas do protótipo; "Onde está" = [—] até as etapas existirem; nova aluna com link, importar CSV) · AD03 parcial (dados, acessos, gerar link, copiar mensagem WhatsApp, desativar, **definir senha da aluna**; faltam conversas, pastas, impersonar) · AD08 ✓ (o que cada acesso libera, mapa produto→acesso, log de eventos, reprocessar) · AD11 parcial (editor JSON das settings) · AD04–AD07, AD09, AD10, AD12, AD13: não começadas.

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
- Testes: 34 unitários (Vitest, incluindo conferência do conteúdo contra o protótipo) + 5 e2e (Playwright). `typecheck`, `lint` e `build` limpos.

## Simulado ou provisório
- Ícones do app (marca "SDM" gerada por script) até vir a arte oficial.
- Roteiros de 5 blocos das aulas: vazios (vêm do contexto v6).
- Comissão dos produtos da vitrine: vazia (`[valor]` no protótipo).
- `WhatsAppSender`: só adaptador de log. `TrackingProvider`: vazio. `MetricsProvider`: manual.
- Agentes de IA: 10 linhas em `agents`, inativas, prompt `[PENDENTE]`. Hoje os textos saem do **motor modelo SDM** (`src/lib/gen/modelo.ts`, frases-base do protótipo + ficha do produto; agente gravado como `modelo-sdm`, custo 0). Geração de imagem com IA: código pronto (`src/lib/gen/ia.ts`), liga com `OPENAI_API_KEY` + `ai_models.image` no AD11.
- Settings `ai_models`: `[conferir]` (a doc da OpenAI estava bloqueada pela rede do ambiente de dev).
- Webhook Hubla: nomes de evento, caminhos do payload e header `x-hubla-token` **não conferidos** na doc da Hubla.

## Quebrado / bugs conhecidos
- Fluxo completo testado em produção com conta de teste (cadastro → pasta → país → link → kit → 3 anúncios, ganchos, roteiros, bio → upload → PNG com imagem → biblioteca), conta apagada depois.
- Produção OK desde 2026-11-05: `/api/health` com banco conectado (117 aulas); testado A01→A02 com e-mail sem cadastro, link falso recusado, /admin sem login → /admin/entrar. Falta a dona testar o login do admin pelo e-mail e o link de uma aluna teste. (A senha nova do banco levou alguns minutos pra valer no pooler.) Login por e-mail e por link de acesso ainda não testados de ponta a ponta no Supabase real.

## Próximos 3 passos
1. **Você**: `docs/DEPLOY.md` → "Falta": `DATABASE_URL` na Vercel, Redeploy, revogar tokens; depois testar `/admin/entrar` e o link de acesso de uma aluna teste.
2. Fases 3–5 (resto): A05/A06 diagnóstico, V03/V04 recomendação, F05–F07 (depende de `PAGE_TOOL_NAME`), link da bio com contagem de cliques, trilhas T01–T03, números N00–N04. Fase 2 (resto): A04–A07 (boas-vindas, diagnóstico, resultado, combinado), I02–I05, FR01–FR04, B01–B04, L03/L05/L06, cartões e grupo, seguindo o protótipo.
3. Quando o contexto v6 chegar: roteiros de 5 blocos, regras dos agentes (seção 10) e conferência das regras de desbloqueio (4.4).

## Pendências que dependem de você
| Desde | Pendência |
|---|---|
| 2026-11-05 | Subir `docs/SDM_contexto_completo_v6.md` (protótipos já chegaram) |
| 2026-11-05 | Trocar as senhas temporárias das 2 contas full (dona e Fellipe: aluna com SDM/UP1/D1/UP2/D2 + admin) em Perfil → Trocar senha |
| 2026-11-05 | Decidir quando desligar `cadastro_aberto` (hoje qualquer pessoa cria conta e ganha SDM) |
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
- Pasta do produto: textos gerados pelo motor modelo SDM até a IA ser ligada; cada geração vira uma versão nova em `generated_items` (rascunho → aprovado), nada é publicado pelo app (ADR-012).
- Imagens no bucket privado `sdm` do Supabase Storage (`alunas/{aluna}/{pasta}/...`), sempre por URL assinada; upload até 4 MB (limite da Vercel).
- Deploy do banco por GitHub Actions (`.github/workflows/supabase.yml`), porque o container de dev não alcança o Supabase e a dona do projeto prefere não usar terminal. CI (`ci.yml`) roda typecheck, lint, testes e build em todo push.
- 1º admin nasce no 1º login com `ADMIN_EMAIL` (sem precisar de `pnpm seed:admin`).
- URL e chave publishable do Supabase fixas no código (`src/lib/public-config.ts`), a pedido; env com o mesmo nome tem prioridade (ADR-009).
- `ACCESS_LINK_SECRET` opcional (HMAC da chave secret); `APP_URL` opcional (domínio de produção da Vercel).
- Login com e-mail e senha, cadastro livre controlado por `cadastro_aberto` (ADR-011, substitui ADR-010). Integração Hubla → e-mail de acesso: adiada a pedido (2026-11-05).
- Produção: Supabase us-west-2, pooler `aws-1-us-west-2.pooler.supabase.com:6543`; Vercel projeto `sdm-app` (prod branch = `claude/intelligent-bohr-54teds`).

## Variáveis de ambiente em uso
Obrigatórias no deploy: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_EMAIL`. Com padrão: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (fixos no código), `ACCESS_LINK_SECRET` (derivado), `APP_URL` (Vercel), `WHATSAPP_PROVIDER` (`log`). Em uso se existirem: `HUBLA_WEBHOOK_SECRET`, `HOTMART_WEBHOOK_SECRET`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`. Declaradas e ainda sem uso: `OPENAI_API_KEY`, `TRACKING_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `RESEND_API_KEY`, `WHATSAPP_API_KEY`. GitHub Actions: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.
