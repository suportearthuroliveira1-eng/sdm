# Changelog

## 2026-11-09 · País Oculto: o time sempre entra
- Em produção a dona liberou o acesso e mesmo assim caiu num 404. Agora quem é do time (admin, suporte, conteúdo) sempre entra no País Oculto, sem estar na lista. A lista aceita qualquer id no formato uuid (antes um id fora da versão 4 invalidava a lista inteira) e, se o valor salvo tiver algum campo estranho, a lista de quem tem acesso não se perde. Atalhos `/oculto` e `/app/pais-oculto` levam pra `/app/oculto`; botão "Abrir o País Oculto" no admin.

## 2026-11-06 · País Oculto, Aulas no admin, Marca, Time e criar aluna com senha
- **País Oculto** (`/app/oculto`): área secreta, só pra quem o time libera (Admin → País Oculto ou "Liberar o País Oculto" ao criar a aluna). Quem não está na lista não vê nada. Abre com um **castelo à noite**: estrelas, lua, bandeiras, a chave gira, o portão abre em 3D, sai luz e faíscas, "Bem-vinda ao País Oculto". Depois o **mapa secreto** (bússola girando): a IA (agente `oculto_mapa`) escolhe 3 de 11 mercados pouco olhados (Portugal, brasileiras nos EUA e na Europa, Irlanda, Canadá, Austrália, Nova Zelândia, Holanda, nórdicos, Emirados, Singapura) e as cartas viram uma por uma. Cada país abre o **dossiê da estratégia secreta** (agente `oculto_estrategia`): o segredo, produto, ângulo, oferta (preço da tabela do app), onde divulgar, plano em 3 fases, ganchos, onde receber e cuidados, cada parte com um selo que se abre. "Criar este produto com a IA" cria a pasta de produto próprio com a ideia escolhida e leva pra ficha. Convite brilhando no Início pra quem tem acesso.
- **Admin → Aulas e trilhas**: criar/editar trilhas (nome, parte, objetivo, regra, ordem, capa, banner, cor) e aulas (em qualquer trilha, vídeo, minutos, objetivo, "agora faça", publicada, acessos, capa), subir/descer, mover de trilha, apagar com trava. A aluna vê banner da trilha e capa da aula nas Aulas e no topo da aula.
- **Admin → Marca e foto da Amanda**: foto (login, boas-vindas, menu, Início com a frase dela), ícone do app (menu, login, aba do navegador, manifesto do app instalado) e nome.
- **Admin → Time do admin**: adicionar alguém do time com papel (admin, suporte, conteúdo; login novo ganha senha provisória), trocar papel, tirar acesso (sempre sobra um admin).
- **Nova aluna** no admin: entra com e-mail + senha provisória (padrão; só em conta nova) ou só o link; opção de liberar o País Oculto.
- Imagens: `salvarImagemPublica` + `/api/publico/...`. Sem migration (ADR-024). Testes: 69 unitários; `scripts/e2e/oculto.mjs` (portão, mapa, estratégia, criar produto, telas do admin).

## 2026-11-06 · Entenda mais simples, ficha com um botão só e "O que é?" em cada etapa
- **Entenda do produto próprio** reorganizado em 3 blocos: abertura com o robô e um balão que mostra o que a IA pensa (uma frase por vez, lendo os dados do diagnóstico); **a escolha logo em cima** (A IA faz tudo / passo a passo); e o caminho em **4 fases** (A ideia, O produto, O ebook, Vender) numa trilha que se acende sozinha (toque numa fase pra parar nela). Saíram o fluxograma de 10 passos e o painel de 4 abas. A animação automática respeita "reduzir movimento" e "animações desligadas" do admin.
- **Ficha**: um botão de IA só. "A IA monta a ficha pra mim" escreve o rascunho (se faltar) e já monta a ficha num clique. As 3 perguntas ficam atrás de "Prefiro contar com as minhas palavras antes" (com "Me ajuda a escrever esta" na primeira). O botão desligado "Gerar a ficha com a IA" saiu.
- **"O que é ...?" em toda etapa** (`guiaEtapa` em `src/lib/domain/explica-etapas.ts`): o que é em uma frase, pra que serve, exemplo e "Você / A IA". Substitui o "Entenda" curto no topo das etapas (aberto até a etapa ficar feita).
- **Diagnóstico**: pergunta quanto dá pra investir em anúncio por mês, se prefere pago, orgânico ou os dois, e se topa aparecer nos vídeos (10 perguntas). A regra de decisão cruza verba e preferência; Divulgar mostra a sugestão do diagnóstico.
- `scripts/e2e/entenda-ficha.mjs` (prints no celular) e `fluxo-ia.mjs` atualizados.

## 2026-11-06 · Alunas no admin (de novo)
- Segundo erro da tela: com o driver `pg`, `array_agg` de enum (acessos) vinha como texto `{sdm,up1}`, não lista, e quebrava a tela quando havia aluna com acesso. A consulta agora agrega `produto::text`. Conferidas todas as telas do admin e a ficha da aluna (senha provisória → 1º login obriga a criar a definitiva → provisória deixa de valer).

## 2026-11-06 · Hubla, varredura das etapas, link da bio e criativos em passo a passo
- **Admin → Alunas** voltou (a consulta usava `s.criado_em`; a coluna é `created_at`).
- **Hubla** (doc oficial v2.0.0 conferida): token `x-hubla-token` cadastrado em Admin → Chaves (`HUBLA_WEBHOOK_TOKEN`); eventos `invoice.payment_succeeded`, `customer.member_added`, `subscription.activated` liberam; `invoice.refunded`, `customer.member_removed`, `subscription.deactivated` e `invoice.status_updated` com `chargeback` revogam; comprador também em `event.invoice.payer`. Conta nova → **senha provisória** (`gerarSenhaProvisoria`) enviada por e-mail (Resend, chave em Admin → Chaves; remetente em `email_remetente`). No 1º login a marca `trocar_senha` (metadata do usuário) leva pra "Crie sua senha definitiva". "Não recebi meu acesso" reenvia (só pra conta que ainda não entrou). Ficha da aluna: "Gerar senha provisória" (mostra uma vez, mensagem pro WhatsApp, ou manda por e-mail). Acessos e webhooks: liga/desliga, URL do webhook, passo a passo do que falta, produto e comprador em cada evento.
- **Etapas que travavam**: gravação das caixinhas e do "feito" agora é atômica no banco (antes uma gravação apagava a outra); checklist mostra o que falta e permite "concluir assim mesmo"; Plataforma de venda aceita "abri no celular e está certo" quando o site bloqueia o teste; afiliada do SDM sem ficha do SDM segue com "Vou usar as peças do kit". `scripts/e2e/varredura.mjs` passa por TODAS as etapas pela tela: produto próprio 19/19, afiliada 10/10.
- **Link da bio**: `/l/código` virou página de links de verdade (nome, frase, botão do produto, até 4 links), editável em Rede e perfil; o botão conta e leva ao produto em `/l/código/ir`. Antes redirecionava direto pro checkout.
- **Criativos e roteiros** em passo a passo (Anúncios, Imagens, Ganchos, Roteiros, Bio): uma seção por vez, ✓ por seção, anterior/próximo e "seguir pra próxima etapa". **Rede e perfil** em 3 partes (`SubPassos`).

## 2026-11-06 · Tudo pronto num lugar só e ebook bem maior
- **Tudo pronto** (`/app/p/[id]/pronto`): ebook com capa, PDF aberto na tela (computador), abrir/baixar/ver em português; página de vendas montada como página (celular/computador, idioma/português, copiar tudo); oferta com preço; ficha; anúncios com imagem e "copiar texto". Atalhos no painel, no Início, no topo de cada etapa e no fim do "A IA faz tudo".
- **Ebook maior**: capítulo com abertura, introdução, 3–4 seções, passo a passo, "na prática", erros comuns, destaque, resumo e exercício (`capituloOut`), com palavras-alvo pelo tamanho (Curto/Médio/Grande/Completo: 5/10/20/30); agente novo `extras_ebook` (introdução, como usar, conclusão, próximos passos, aviso). "A IA escolhe por mim" = 6 capítulos, Grande. Teste real: 6 capítulos, ~3.900 palavras, **36 páginas**; capítulo 31 s em média (máx. 42 s).
- **PDF novo** (`src/lib/gen/ebook-pdf.tsx`): fontes de verdade (Plus Jakarta Sans, Lora, Playfair Display em `public/fonts`, OFL), capa com formas, créditos, sumário clicável, introdução com "como usar", abertura colorida por capítulo com número grande, cabeçalho e rodapé, subtítulos que não ficam sozinhos, caixas (na prática, erros comuns, pra lembrar), citação, exercício com linhas, conclusão com checklist e página final. Títulos sem numeração duplicada (`limparTitulo`).
- `X-Frame-Options: SAMEORIGIN` só em `/api/ebook/*` (prévia do PDF dentro do app); `outputFileTracingIncludes` leva as fontes pra função da Vercel.

## 2026-11-06 · Preço sugerido com moeda, A IA escolhe tudo e voltar de onde parou
- **Preço**: regra por moeda (`src/lib/domain/precos.ts`: USD/EUR US$ 9 · faixa 7–17 · teto 27; GBP £ 8 · 6–15 · 24; BRL R$ 27 · 19–47 · 67), editável no admin (setting `precos_ebook`). A oferta usa o sugerido (não o número da IA); `CampoPreco` mostra símbolo, "Usar o sugerido", faixa e teto; preço acima do teto é recusado na tela e no servidor (oferta e Idioma e país). Trocar de país troca a moeda e volta pro sugerido.
- **A IA escolhe por mim**: no ebook, botão que cria o sumário com 5 capítulos, ~10 páginas, tom amiga ("Prefiro escolher eu mesma" abre as opções, já com a sugestão marcada). No painel do produto: "Deixe a IA fazer o resto" (piloto pula o que já está feito).
- **Voltar de onde parou**: `students.ultima_tela` (migration 0009) gravada em toda etapa e aula; o Início mostra "Você parou aqui · Continuar", ou o próximo passo vira "Continue de onde parou". Se a IA estava montando o produto e ela saiu (`dados.piloto` sem `fim`), Início e painel mostram "A IA parou no meio: continuar".
- Testes: 53 unitários (preço: moeda, teto, faixa).

## 2026-11-06 · Zerar aluna
- `src/lib/server/zerar.ts` (`zerarAluna`): apaga pastas (e tudo dentro), diagnósticos, aulas vistas, conversas, ebooks, itens, imagens (banco + Storage), favoritos, avisos, semanas e chamados; volta os campos do primeiro acesso pra vazio. Mantém login, e-mail, nome, acessos, papel de admin e custo da IA.
- Admin → Alunas → ficha (AD03): resumo do progresso e "Zerar a aluna" (só papel admin, digitando ZERAR, com auditoria `aluna.zerar`).
- Conta da dona zerada em produção a pedido (a do Fellipe já estava sem progresso).

## 2026-11-06 · Produto mais explicado, IA que faz tudo, robô e Aparência
- **Antes de criar** (Entenda do produto próprio): abertura, "tudo em português primeiro", **Como a IA pensa** (o que ela lê do diagnóstico, robô, o que sai, 4 passos do raciocínio), **fluxograma** animado e clicável (você faz / a IA faz / o que a IA olha) e a escolha: **A IA faz tudo pra mim** ou **passo a passo**. "+ Criar produto" abre direto nessa tela.
- **A IA faz tudo** (`src/lib/actions/piloto.ts` + `components/etapas/piloto.tsx`): confirma, roda um passo por vez (ideias → escolha → rascunho → ficha → oferta → idioma e país → sumário → capítulos) com progresso real, tenta de novo do passo que falhou e para na Revisão (ela aprova). ~2 min no teste.
- **Português primeiro**: ideias, ficha e oferta saem em português; etapa nova **Idioma e país** (`mercado`, depois da oferta) define país e idioma (EUA, Reino Unido, Latinos nos EUA, Espanha, Brasil); ebook e página saem nesse idioma.
- **Ficha**: pra que serve, 3 passos, perguntas numeradas (obrigatória/opcional, salva ao sair do campo), **A IA preenche pra mim** (agente novo `rascunho_ficha`, sem inventar experiência), botão que diz o que falta.
- **Robô da IA** (`components/ux/ia-trabalhando.tsx`): tela com robô animado, o que a IA está fazendo, passos e progresso em toda ação de IA.
- **Mais cor**: cada etapa com cor e ícone (`visual-etapas.ts`, `components/ui/icone.tsx`); paleta de apoio (verde-água, âmbar, rosa, azul, laranja).
- **Admin → Aparência**: 5 temas prontos, cores, cantos, animações liga/desliga, prévia ao vivo e aviso de contraste AA (setting `tema`, injetado no layout raiz).
- `maxDuration = 60` nos layouts (ações de IA não são cortadas pela Vercel); erros de rede viram mensagem em vez de tela parada. Toast no topo.
- Testes: 50 unitários; `scripts/e2e/piloto-ia.mjs` (IA faz tudo) e `fluxo-ia.mjs` atualizados.

## 2026-11-06 · Personalizar no admin, primeiro acesso obrigatório e passos do produto
- **IA ligada em produção** sem Vercel: tabela `app_secrets` (migration 0008, RLS sem política) + Admin → Chaves e variáveis (salva testando na OpenAI). `segredo()` lê banco → env (ADR-016).
- **Velocidade**: funções na região do banco (`vercel.json` → pdx1; antes iad1, ~70 ms por consulta); login conferido localmente com `getClaims()` (JWT ES256) no proxy e no servidor.
- **Diagnóstico**: escolher → **Confirmar** (salva e avança) e **Voltar**; "Outro" com campo; múltipla com "pode marcar mais de uma"; perguntas, tipos (uma/várias/texto) e regras de decisão (caminho/divulgação com peso) vêm do admin (`diagnostico`). Modo "regras" (IA só explica) ou "ia" (IA decide com as regras de orientação).
- **Primeiro acesso obrigatório** (setting `fluxo`): sem terminar boas-vindas, combinado, diagnóstico e caminho, o app volta pra tela que falta; dá pra pular boas-vindas/combinado e liberar "Decidir depois".
- **Admin → Personalizar**: Fluxo e textos (regras + textos de boas-vindas, combinado, cartões do caminho, nome e explicação de cada etapa), Diagnóstico e decisão (editor de perguntas/opções/regras), Inteligência artificial (modelos, cotas, regras base, Professora, cada agente: ligado, modelo, limite, prompt com versões e custo de 7 dias). Menu do admin agrupado.
- **IA**: `rodar()` lê do admin regras base, agente desligado, modelo e limite; o texto do prompt entra no hash do cache.
- **Produto**: cabeçalho "Passo X de N" com barra e trilha clicável, Entenda recolhido em etapa feita, anterior/próxima no rodapé, botão principal fixo no Entenda, etapa fechada leva pro passo de agora; painel com Continuar, progresso, fases e motivo do cadeado uma vez só (sem o código interno).
- Fade de tela mais curto; "Preparando..." duplicado saiu da escolha do caminho.
- Testes: 45 unitários (decisão com peso, validação de resposta, ordem do primeiro acesso), 6 e2e, fluxo inteiro com IA.

## 2026-11-05 · Telas presas em produção: causa achada e corrigida
- Causa medida: pooler do Supabase na porta 6543 + pipelining do driver `postgres` = consultas que nunca voltam a partir de 6 em paralelo (ADR-015).
- Tentativa com modo sessão (5432) estourou o limite de 15 conexões e derrubou o site por alguns minutos; revertida.
- Correção: driver `pg` (`drizzle-orm/node-postgres`) na 6543. `execute()` lê `.rows` (admin, health, rate limit). Fluxo inteiro com IA, e2e e carga (12 pedidos em paralelo) passando.
- Clientes do Supabase com prazo de 10 s por chamada (`src/lib/supabase/fetch-com-prazo.ts`).
- Oferta: preço 0 da IA aparece como `[valor]` (não inventa número).
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
