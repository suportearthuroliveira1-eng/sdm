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
