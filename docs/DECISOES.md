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
