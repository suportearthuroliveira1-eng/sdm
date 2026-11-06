# Decisões (ADR curto)

## ADR-001 · Seguir sem os docs de produto no 1º chat
- **Contexto:** o prompt manda ler `docs/SDM_contexto_completo_v6.md` e os protótipos, mas eles não vieram.
- **Decisão:** construir a Fase 1 (infra, banco, auth, admin, PWA), que não depende do conteúdo, e deixar os seeds de conteúdo lendo `db/seed-data/conteudo.json`, gerado dos docs quando chegarem.
- **Alternativas:** parar e esperar; inventar aulas/textos (proibido pela regra 6).
- **Consequência:** textos das telas feitas são provisórios e precisam ser conferidos com o protótipo.

## ADR-002 · Next 16 sem Cache Components
- **Contexto:** o create-next-app 16 liga `cacheComponents`, que exige `<Suspense>` em toda leitura de cookie.
- **Decisão:** desligar. Quase tudo é por aluna e dinâmico; o ganho de shell estático é pequeno e a complexidade é grande.
- **Consequência:** dá pra religar por rota no futuro (Fase 9) se a performance pedir.

## ADR-003 · Drizzle no servidor + RLS como segunda barreira
- **Contexto:** o prompt pede Drizzle e RLS.
- **Decisão:** o servidor fala com o Postgres via `DATABASE_URL` (ignora RLS) e sempre filtra pela aluna da sessão (`requireStudent`). RLS fica ligada em todas as tabelas para qualquer acesso com anon key (Storage, Realtime, cliente).
- **Alternativas:** usar só supabase-js com RLS (perde o Drizzle tipado e as transações).
- **Consequência:** todo código novo de aluna tem que passar pelo `requireStudent` e filtrar por `student.id`.

## ADR-004 · Link de acesso e sessão sem senha
- **Decisão:** JWT HS256 (`ACCESS_LINK_SECRET`) com `sub`=aluna e `jti` salvo em `access_links`; consumo atômico (`UPDATE ... WHERE used_at IS NULL AND expires_at > now()`); a sessão do Supabase nasce no servidor com `auth.admin.generateLink(magiclink)` + `verifyOtp(token_hash)`. A página do link pede um toque antes de consumir.
- **Alternativas:** mandar o magic link do próprio Supabase (expira em 1h, não é uso único sob nosso controle, e a prévia do WhatsApp gasta).
- **Consequência:** depende da service role só no servidor.

## ADR-005 · Rate limit no Postgres
- **Decisão:** tabela `rate_limits` com janela fixa via `INSERT ... ON CONFLICT`. Limpeza diária por job Inngest.
- **Alternativas:** Upstash/Redis (mais um serviço e mais uma chave).
- **Consequência:** suficiente pro volume previsto; trocar se virar gargalo.

## ADR-006 · Modelos de IA como configuração não conferida
- **Contexto:** a doc da OpenAI estava inacessível pela rede do ambiente de dev.
- **Decisão:** `settings.ai_models` com `[conferir]` e classes (`text_cheap`, `text_mid`, `image`, `embedding`); nenhum nome no código. Conferir na doc antes da Fase 3.

## ADR-007 · Conteúdo semeado direto do protótipo
- **Contexto:** o protótipo traz MODS, VIT, GLOSS, CKDEF, PASSOS, INFODEF, ENT, HEAD, DIAG, PAISES e LG como JS.
- **Decisão:** avaliar as constantes num `vm` (`docs:extract`) e mapear por script (`docs:conteudo`) para `conteudo.json`, validado por Zod e por testes (111 + B1 + 5 PO, 32 + 7 termos, alvos do "Agora faça" = telas do app).
- **Alternativas:** digitar à mão (erro e risco de inventar).
- **Consequência:** mudou o protótipo → rodar os dois scripts e o seed de novo. O `vm` não é sandbox de segurança: só rodar com arquivos do próprio projeto.

## ADR-008 · Migrations de produção pela CLI do Supabase
- **Contexto:** o container de dev não alcança o Supabase; a dona do projeto já usa a CLI.
- **Decisão:** `drizzle/` continua a fonte (gerada do schema); `pnpm db:supabase` copia pra `supabase/migrations` (timestamps estáveis do journal) e `supabase/seed.sql` é gerado com `pg_dump --inserts --on-conflict-do-nothing`. Produção: `supabase db push --include-seed`. `pnpm db:migrate` fica só pro banco local de teste.
- **Consequência:** nunca editar `supabase/migrations` à mão; não misturar `drizzle-kit migrate` em produção (controle de versão diferente).

## ADR-009 · Supabase público fixo no código
- **Contexto:** a dona pediu pra deixar fixos os dados do banco que enviou (URL e chave publishable). Senha do banco e chave secret não foram enviadas.
- **Decisão:** URL e publishable em `src/lib/public-config.ts` (são públicas: vão pro navegador, quem protege é o RLS). Secret, senha do banco e demais chaves continuam só em variável de ambiente. `ACCESS_LINK_SECRET` passa a ter padrão derivado (HMAC da secret) e `APP_URL` cai pro domínio da Vercel.
- **Alternativas:** commitar tudo (expõe o banco inteiro a quem vê o repositório); manter tudo em env (mais passos pra dona).
- **Consequência:** trocar de projeto Supabase = editar esse arquivo ou definir as env. Trocar a chave secret invalida links de acesso pendentes.

## ADR-010 · Login por e-mail via link (fluxo implicit)
- **Contexto:** o Supabase no plano grátis, sem SMTP próprio, não deixa trocar o template do e-mail, então `{{ .Token }}` não aparece; o e-mail padrão só traz o link.
- **Decisão:** `signInWithOtp` com `flowType: "implicit"` e `emailRedirectTo=/auth/confirmar?to=...`. A sessão volta no fragmento da URL e a página chama `setSession` no navegador, então funciona mesmo abrindo o e-mail em outro aparelho (o PKCE exigiria o mesmo navegador). O campo de código continua: com SMTP próprio e `{{ .Token }}` no template, os dois caminhos valem.
- **Consequência:** o e-mail padrão tem limite de 2 por hora no projeto. O caminho principal da aluna continua sendo o link de acesso do WhatsApp (não depende de e-mail).

## ADR-011 · Login com e-mail e senha, cadastro livre (substitui ADR-010)
- **Contexto:** pedido do Fellipe (2026-11-05): tirar o código por e-mail, "só e-mail e senha", deixar criar conta livre. O e-mail grátis do Supabase também limita a 2 por hora.
- **Decisão:** `signInWithPassword` na A01 e no admin. Cadastro pelo servidor (`auth.admin.createUser` com `email_confirm: true`, cadastro público do Supabase continua desligado) e acesso SDM automático enquanto `cadastro_aberto` = true. E-mail já existente não pode se cadastrar de novo; quem foi criado pelo time entra pelo link de acesso e cria a senha em `/app/senha`, ou o admin define a senha na AD03.
- **Alternativas:** manter código/link por e-mail (precisa de SMTP próprio); senha gerada e enviada por e-mail (adiado junto com a Hubla).
- **Consequência:** muda a regra do prompt (seção 3: "sem senha" e "só entra quem comprou") enquanto `cadastro_aberto` estiver ligado. Sem e-mail, "esqueci a senha" é pelo time (AD03) ou pela A02. Quando a Hubla entrar, desligar `cadastro_aberto`.

## ADR-012 · Geração sem IA enquanto a chave não existe (motor modelo SDM)
- **Contexto:** pedido de fluxo funcional de criar produto, copy e criativo; ainda não há `OPENAI_API_KEY` nem nomes de modelo conferidos.
- **Decisão:** portar o gerador do protótipo (`GEN`, frases `LG`/`PT`) pra `src/lib/gen/modelo.ts`: monta kit, quiz, anúncios, ganchos, roteiros e bio a partir da ficha do produto, no idioma de venda + pt, com `por_que_funciona` e `checagem`. Mesmo formato de saída que os agentes de IA vão usar, então trocar o motor não muda telas nem banco. Criativo em PNG por `next/og` (sem IA, sem custo).
- **Alternativas:** esperar a chave (nada funcional); texto fixo de exemplo (seria inventado).
- **Consequência:** os textos são corretos mas previsíveis. Quando a IA ligar, `gerarItens` passa a chamar os agentes por tipo, com cache por hash de entrada.

## ADR-013 · O fluxo do PDF "App SDM · fluxo ideal" vira a referência de navegação
- **Contexto:** a dona mandou o PDF com o fluxo ideal: dois caminhos (afiliada do SDM e produto próprio com IA) que seguem pela mesma divulgação; regras "um próximo passo só", "explica antes de pedir", "tudo por produto", "etapa bloqueada diz por quê".
- **Decisão:** primeiro acesso em `(primeiro)`, pastas por tipo com etapas definidas em código puro (`etapas.ts`) e rota única `/app/p/[id]/[etapa]`. As telas antigas da vitrine (V05–V09, F02, F04, DV01) continuam pras pastas de produto da vitrine e o DV01 serve de "Criativos e roteiros" pra todas.
- **Consequência:** IDs de aula do PDF (A1.x, B1.x...) ainda não existem na grade; a tela mostra "[vídeo em breve]" até a grade nova chegar.

## ADR-014 · Modelos e custo da IA
- **Contexto:** doc oficial conferida em 2026-11-05 (developers.openai.com/api/docs/pricing.md).
- **Decisão:** `gpt-6-luna` (US$ 0,10/0,50 por 1M) pra diagnóstico, ideias, ficha, anúncios, roteiros, professora; `gpt-6.1-terra` (US$ 1/5) pra oferta, ebook e página; `gpt-image-1-mini` pra imagem; `text-embedding-3-small` reservado. Raciocínio "low", regras fixas no início (cache automático), `prompt_cache_key` por agente, cache de resposta por hash, cota diária por aluna.
- **Medido no teste:** diagnóstico ~6–15 s; ebook de 4 capítulos ~50 s; fluxo inteiro ~4 min.

## ADR-015 · Driver `pg` no lugar de `postgres` (pooler do Supabase em modo transação)
- **Contexto:** em produção telas ficavam presas ("Entrando...", "Enviando o pedido...") de forma intermitente. Teste de carga medido na Vercel: com o pooler na 6543 (modo transação), 6 ou mais consultas em paralelo nunca voltavam; até 5 voltavam em ~0,5 s. O driver `postgres` usa pipelining quando há mais consultas que conexões, e o pooler trava com isso.
- **Tentativa que não serviu:** modo sessão (5432). Resolveu a trava, mas o plano tem limite de 15 conexões no total e as instâncias da Vercel estouraram (`EMAXCONNSESSION`, site fora por alguns minutos). Voltei pra 6543 na hora.
- **Decisão:** `src/lib/db/index.ts` usa `pg` (Pool, `max` 5, ociosa 20 s, vida máx. 5 min, conexão 10 s, consulta 25 s) com `drizzle-orm/node-postgres`, na 6543. `pg` não faz pipelining: a consulta espera na fila do Pool. Resultado de `db().execute()` agora vem em `.rows`. Clientes do Supabase (proxy, servidor, admin) com fetch de prazo 10 s.
- **Consequência:** a `DATABASE_URL` na Vercel continua com 6543. Scripts (`scripts/*`) seguem com `postgres` (rodam fora da Vercel, contra banco local ou direto).

## ADR-016 · Chave da OpenAI cadastrada no admin (tabela `app_secrets`)
- **Contexto:** a dona pediu a OpenAI ligada com a chave "fixa no código". Chave em commit fica pra sempre no histórico e o GitHub/OpenAI bloqueiam ou revogam; o token da Vercel tinha expirado.
- **Decisão:** tabela `app_secrets` (RLS ligado sem política, `REVOKE` de anon/authenticated); `segredo(k)` lê banco → variável de ambiente, cache de 30 s; tela **Admin → Chaves e variáveis** (só papel admin) salva testando na OpenAI, mostra só os 4 últimos caracteres; auditoria sem o valor. Variáveis que o app precisa pra ligar (banco, service role) continuam só na Vercel.
- **Consequência:** a IA ligou em produção sem Redeploy. Trocar a chave = colar a nova no admin.

## ADR-017 · Personalizar pelo admin (settings validadas) e primeiro acesso obrigatório
- **Contexto:** a dona pediu pra configurar tudo no admin (respostas do diagnóstico, fluxo, decisão da IA, textos) e que a aluna não use o app sem responder.
- **Decisão:** settings `diagnostico`, `fluxo`, `textos_app`, `ia` validadas com Zod (`src/lib/domain/config-schemas.ts`); valor inválido ou ausente cai no padrão do código. Telas em Admin → Personalizar salvam com auditoria. Decisão do caminho = soma de pesos por opção (`decidir()`), empate → padrão; modo "regras" fixa o caminho e a IA só explica. Prompt de agente vira versão nova na tabela `agents` (dá pra voltar). Primeiro acesso: `passoPendente()` no layout das abas; admin não é barrado.
- **Consequência:** mudar código de pergunta (`k`) deixa respostas antigas sem par (aviso na tela). Variáveis que o app precisa pra ligar continuam na Vercel.

## ADR-018 · Região pdx1 e login conferido localmente
- **Decisão:** `vercel.json` `regions: ["pdx1"]` (banco em us-west-2). `getClaims()` no lugar de `getUser()` (JWT ES256 com JWKS em cache), sem ida ao Supabase a cada pedido.
- **Consequência:** sessão revogada em outro lugar vale até o JWT vencer (1 h); aluna desativada continua barrada pelo banco.

## ADR-019 · Produto próprio em português primeiro e "A IA faz tudo"
- **Contexto:** a dona pediu o produto em português e só depois escolher país e idioma; e um botão pra IA fazer o produto inteiro.
- **Decisão:** até a etapa `mercado` (Idioma e país, depois da oferta) os agentes recebem `idioma_venda: "pt"`; ebook e página usam o idioma do país escolhido. Isso ajusta a regra 9 (conteúdo do comprador no idioma de venda) só pras etapas antes da escolha. "A IA faz tudo" é orquestrado pela tela (um passo por chamada, cada um < 60 s), idempotente, e aprova oferta e sumário em nome dela porque ela pediu; para na Revisão, que só ela faz (regra 4: nada publicado sem ela).
- **Consequência:** trocar o país depois marca `mercadoMudou` e avisa pra refazer ebook/página.

## ADR-020 · Tema editável (Admin → Aparência)
- **Decisão:** setting `tema` validado (#RRGGBB, raio 6–28, animações) vira CSS variables no layout raiz; o resto das cores deriva com `color-mix`. Vazio = visual do protótipo (regra 8). Temas prontos passam AA (teste); o editor avisa quando uma cor quebra o contraste.

## ADR-021 · Preço do ebook por regra, não pela IA
- **Contexto:** a dona pediu "preço sugerido, nunca preço alto, e a moeda". O número da IA variava (9, 0, [valor]).
- **Decisão:** sugestão, faixa e teto por moeda numa tabela (`precos.ts`, editável em `precos_ebook`). A IA não define preço; o app recusa acima do teto. A moeda segue o país da pasta (provisório até a etapa Idioma e país).

## ADR-022 · Venda na Hubla cria a conta com senha provisória
- **Decisão:** a venda (webhook Hubla) cria a aluna e o login; se houver e-mail configurado (Resend), gera senha provisória e envia; a marca `trocar_senha` fica no `user_metadata` do Supabase (vai no JWT, sem migration) e obriga a criar a definitiva no 1º acesso. Sem e-mail configurado, o admin gera a senha na ficha (mostra uma vez) e manda no WhatsApp. Reenvio pela própria aluna só pra conta que nunca entrou ou ainda está com a provisória (ninguém troca a senha de quem já usa o app). Token da Hubla e chave do Resend em Admin → Chaves (`app_secrets`).

## ADR-023 · Nenhuma etapa trava por falta de configuração
- **Decisão:** checklists permitem "concluir assim mesmo" (com o que falta à vista); checkout aceita confirmação da aluna quando o site bloqueia o teste automático; criativos/roteiros da afiliada podem ser marcados como feitos usando o kit. Gravação de caixinhas e "feito" é atômica (jsonb_set no banco).
