# Prompt pro Claude Code · App SDM completo

> Cole tudo abaixo no Claude Code, dentro de uma pasta vazia do projeto.
> Antes, coloque na pasta `docs/`:
> - `docs/SDM_contexto_completo_v6.md` (fonte única de produto)
> - `docs/prototipo/App.dc.html` e `docs/prototipo/Admin.dc.html` (protótipo com todas as telas, textos e fluxos)
>
> As chaves NÃO vão neste prompt. Elas vão só no arquivo `.env.local` (passo 0).

---

## PROMPT

Você vai construir do zero, completo e pronto pra produção, o **App SDM (Sistema Dólar Mundial)**: um app instalável (PWA) pra alunas da Amanda Gomes, com área de membros, IA, gerador de imagem, gerador de ebook e painel admin completo.

### 0. Antes de escrever código

1. Leia inteiro `docs/SDM_contexto_completo_v6.md`. É a **fonte única**: produto, público, regras, grade de 111 aulas + B1, mapa de cada "Agora faça" pra tela, IDs, dados, UI/UX, admin, métricas e pendências. Se algo aqui contradizer o contexto, o contexto vence (exceto as decisões novas da seção 2 deste prompt).
2. Abra `docs/prototipo/App.dc.html` e `docs/prototipo/Admin.dc.html`. Eles têm **todas as telas já desenhadas**, com os textos finais, a ordem dos fluxos, os estados e as regras de navegação (o bloco `<script type="text/x-dc">` tem os dados: MODS, VIT, LG, PT, DIAG, GLOSS, CKDEF, PASSOS, INFODEF, ENT, HEAD). Reproduza fielmente: mesmas telas, mesmos IDs, mesmos textos, mesmo visual.
3. Crie `.env.example` com todas as variáveis e peça pra eu preencher `.env.local`. **Nunca** escreva chave em código, commit, log ou mensagem. Chave só no servidor.
4. Antes de usar qualquer modelo da OpenAI, confira na documentação oficial atual da OpenAI os nomes e preços vigentes dos modelos de texto, imagem e embedding, e use os mais baratos que atendem cada tarefa (seção 6). Deixe todos os nomes de modelo configuráveis pelo admin, nunca fixos no código.
5. Monte um plano em fases (seção 12), me mostre e comece pela Fase 1 sem esperar, a menos que encontre uma contradição real.

### 0.1 Memória do projeto (obrigatório, desde o primeiro minuto)

Eu vou abrir vários chats ao longo do desenvolvimento. Qualquer chat novo tem que saber exatamente onde o projeto está sem eu explicar nada. Pra isso:

1. **Crie `CLAUDE.md` na raiz** (o Claude Code lê esse arquivo sozinho em todo chat novo). Ele é curto e aponta pros outros. Contém:
   - O que é o projeto em 5 linhas.
   - Stack e comandos (instalar, rodar, testar, migrar, seed, deploy).
   - Regras que nunca mudam: seção 2 deste prompt, chaves só no `.env.local`, visual do protótipo, nada de número inventado.
   - **"Antes de qualquer tarefa, leia `docs/ESTADO.md`. Ao terminar qualquer tarefa, atualize `docs/ESTADO.md` e `docs/CHANGELOG.md`."**
   - Onde fica cada coisa (mapa das pastas).
2. **Crie `docs/ESTADO.md`**, a foto atual do projeto, sempre reescrita (não é histórico):
   - Fase atual e % de cada fase.
   - O que está pronto e funcionando, tela por tela (lista com os IDs: A01 ✓, V05 parcial…).
   - O que está simulado ou com dado de exemplo.
   - O que está quebrado ou com bug conhecido.
   - Próximos 3 passos, na ordem.
   - Pendências que dependem de mim (com a data em que foram levantadas).
   - Decisões tomadas durante o desenvolvimento e o porquê (uma linha cada).
   - Variáveis de ambiente que já estão em uso (só os nomes, nunca os valores).
3. **Crie `docs/CHANGELOG.md`**, o histórico, sempre acrescentando no topo: data, o que mudou, arquivos principais, migrations novas, e se algo quebra o que existia.
4. **Crie `docs/DECISOES.md`** pra decisões maiores (estilo ADR curto): contexto, decisão, alternativas, consequência. Ex.: escolha do PDF, do job runner, dos modelos de IA.
5. Se eu mudar alguma regra de produto no chat, **atualize também `docs/SDM_contexto_completo_v6.md`**: suba a versão (v7, v8…) e registre no Histórico do próprio arquivo.
6. **Atualize esses arquivos ao fim de cada tarefa, antes de me responder**, mesmo tarefas pequenas. Faça commit junto com o código (`docs: atualiza estado`).
7. Se um chat novo começar e `docs/ESTADO.md` estiver desatualizado em relação ao código (git log mais novo que a última atualização), a primeira coisa é conferir o código e corrigir o `ESTADO.md` antes de seguir.

### 1. Stack

- **Next.js (App Router) + TypeScript estrito + Tailwind**. PWA com manifest, service worker, ícones e tela de instalação (iPhone e Android, tela A03).
- **Supabase**: Postgres, Auth, Storage, RLS em todas as tabelas, extensão `pgvector`.
- **Drizzle ORM** com migrations versionadas e seed.
- **Jobs em segundo plano: Inngest** (geração de ebook, imagens, kits, relatórios semanais, lembretes). Nada pesado dentro da requisição do usuário.
- **OpenAI** via SDK oficial, só no servidor.
- **PDF do ebook**: `@react-pdf/renderer` (sem Chromium). Se precisar de HTML→PDF fiel, use Playwright num job, nunca na requisição.
- **Web Push** com VAPID (`web-push`).
- **Zod** pra validar toda entrada e toda saída da IA. **Vitest** + **Playwright** pra testes.
- Deploy: **Vercel** (app) + **Supabase** (banco e storage) + **Inngest Cloud**.
- Idioma da interface: **português do Brasil**. Conteúdo pro comprador: no idioma de venda (inglês ou espanhol), sempre com tradução pra aluna.

### 2. Decisões de produto (valem acima de tudo)

1. **A aluna é afiliada.** Escolhe produto da vitrine, pega o link de afiliada e divulga. A página de vendas e o checkout são do produtor.
2. **O app não cria nem hospeda página de vendas.** Pra pré-venda e quiz, a IA entrega o **kit** (texto bloco por bloco + prompt de imagem), o app ensina a montar num modelo do SDM numa ferramenta externa (`PAGE_TOOL_NAME`, configurável no admin) e **confere** a página publicada (tela F06, agente `AGT-conferencia`).
3. **Ebook: gerador incluído**, como módulo **"Produto próprio · Ebook"** dentro da pasta do produto. Por padrão abre **depois da 1ª venda** (etapa 7, depois do Escalar), e o admin pode liberar pra todas por um flag (`feature_ebook_unlock: after_first_sale | always | off`). Também serve pra gerar **ebook bônus/isca** pro perfil orgânico. Detalhes na seção 7.
4. **A IA não vende, não conversa com comprador e não publica nada sem a aluna aprovar.**
5. Toda escolha, resposta ou campo preenchido **vai pra frente no fluxo**: salva na hora, aparece nas telas seguintes e alimenta a IA. Nunca pedir a mesma coisa duas vezes.
6. Nunca inventar número, depoimento, prova ou resultado. Onde falta dado: `[valor]`, `[—]` ou o que vier do admin.

### 3. Login e acesso

**AGORA (fase atual): criação manual.** Ainda não existe nada configurado de login, Hubla nem WhatsApp. Então:
- O **primeiro admin** é criado por um script de seed (`pnpm seed:admin`) usando `ADMIN_EMAIL` do `.env.local`.
- No admin (AD02), o botão **"Nova aluna"** cria a aluna à mão: nome, e-mail, WhatsApp (opcional), país e acessos (SDM, UP1, D1, UP2, D2 com caixinhas). Também dá pra **importar CSV** (nome, e-mail, WhatsApp, acessos).
- Ao criar, o sistema gera o **link de acesso** da aluna (token assinado, uso único, expira em 72h) com botão **"Copiar link"** e **"Copiar mensagem pronta pro WhatsApp"**. O time envia à mão. Botão **"Gerar novo link"** pra quem perdeu.
- Na tela A01 a aluna também pode entrar digitando o e-mail: o app manda um **código de 6 dígitos** pelo e-mail padrão do Supabase Auth (sem precisar configurar provedor agora). Se o e-mail não estiver cadastrado, vai pra A02.
- Desativar aluna e tirar acesso também é manual, no admin.
- **Deixe pronto mas desligado** (flag `auth_hubla_webhook=false`): o webhook da Hubla descrito abaixo e o envio automático por WhatsApp. Quando eu ligar a flag, a criação passa a ser automática e a manual continua funcionando.

**DEPOIS (quando eu ligar a Hubla):**
- Login **só com o e-mail da compra, sem senha**. Pra ser seguro: o e-mail recebe **link mágico / código de 6 dígitos** (Supabase Auth OTP). O acesso também chega pelo WhatsApp como **link assinado** (token JWT de uso único, expira em 72h) que já entra.
- Só entra quem tem **entitlement ativo** vindo do webhook da Hubla. Sem compra → tela A02 (reenviar acesso + suporte).
- **Webhook Hubla** (`/api/webhooks/hubla`): validar a assinatura conforme a documentação da Hubla, ser idempotente (guardar o id do evento), registrar tudo em `events` (EVT-000000) e mapear produto Hubla → entitlement por tabela editável no admin (`hubla_product_map`): SDM front, UP1, D1, UP2, D2. Compra libera, reembolso e chargeback revogam.
- Deixe um adaptador `HotmartWebhook` com a mesma interface, desligado por flag (há um teste A/B Hubla × Hotmart).
- Envio de WhatsApp: crie a interface `WhatsAppSender` com um adaptador `[provedor a definir]` e um adaptador de log pra desenvolvimento.

### 4. Banco de dados (Postgres + RLS)

Crie as tabelas abaixo com IDs legíveis além do uuid (sequências: `ALN-000000`, `PRD-000000`, `VIT-0000`, `GEN-000000`, `EVT-000000`). Use o contexto (seção 8) como referência de campos.

- `students` (ALN): email, nome, whatsapp, país onde mora, idiomas[], trabalho, tempo_dia, verba, assuntos[], aparecer, experiência, trilha_pago, trilha_org, combinado_em, cartões (jsonb), rotina_hora, rotina_on, push_subscription, produto_ativo, criado_em, último_acesso.
- `entitlements`: student, produto (sdm | up1 | d1 | up2 | d2), status, origem (hubla | hotmart | manual), datas.
- `hubla_product_map`: id do produto na Hubla → entitlement.
- `events` (EVT): tipo, payload, processado, erro.
- `diagnostics`: respostas versionadas (dá pra refazer).
- `vitrine_products` (VIT): nome, produtor, rede de afiliação, idioma, países, assunto, tipo, resumo, público, dor, o que é, promessa, ganchos base, prompt de imagem, tags, selos (org/ad), concorrência, funil indicado, comissão tipo (pct | fixo) e valor, link da página do produtor, ativo. **Seed com os 6 produtos do protótipo** (marcados como exemplo).
- `student_products` (PRD, a "pasta"): student, vitrine_product, país de venda, país confirmado, link de afiliada + status do teste, cartão "ajuda quem", funil (pre | quiz | direto), url da página, conferido, publicado, pixel_id, data_início_campanha, rede principal, handle, perfil_feito, formatos[], plano de campanha (jsonb), checklists (jsonb por chave), flags de etapa, precisa_refazer, criado_em.
- `generated_items` (GEN): student_product, tipo (kit_pre, kit_quiz, anuncio, gancho, texto_anuncio, roteiro, legenda, bio, ficha_produto, ficha_viral, ebook_outline, ebook_capitulo, ebook_pdf, imagem), idioma, conteúdo (jsonb), tradução_pt, por_que_funciona, checagem (jsonb), status (rascunho | aprovado | publicado), agente, versão, hash_entrada, custo_usd, tokens.
- `images`: student_product, prompt, proporção (1:1 | 4:5 | 9:16), qualidade, storage_path, hash, custo.
- `ebooks`: student_product, título, idioma, tamanho, tom, tema visual, capítulos (jsonb), status (fila | gerando | pronto | erro), progresso, pdf_path, capa_path, mockup_path, custo.
- `lessons`: id da grade (0.1, P3.2, PO.1…), módulo, título, tipo, minutos, objetivo, roteiro (jsonb, 5 blocos), agora_faca_texto, agora_faca_alvo (id da tela | fora | pergunta), vídeo (url), materiais[], requer_entitlement, ordem, publicada. **Seed com as 111 aulas + B1 + PO.1–PO.5 exatamente como na seção 6 do contexto.**
- `modules`: id, nome, parte, objetivo, regra de liberação (compra | trilha_pago | trilha_org | primeira_venda), materiais.
- `lesson_progress`: student, lesson, % assistido, vista_em, agora_faca_em, como (tela | ja_fiz | print).
- `metrics_entries`: student_product, data, fonte (manual | print | conexão), campos pago (gasto, cpm, ctr, cpc, vendas), campos orgânico (views, retenção, seguidores, comentários).
- `link_clicks`: student_product, rede, post, timestamp, user agent hash (o link da bio é do app: `/l/[código]` → redireciona pro funil e conta).
- `sales`: student_product, data, valor, print_path, validada, fonte. **A primeira registrada libera o M7.**
- `profit_weeks`: comissões, gasto com anúncio, outros.
- `chat_messages`: student, student_product, aula atual, papel, texto, anexo (print), tokens, custo.
- `support_tickets`: student, texto, anexo, status, resposta.
- `weekly_banks`: tipo (gancho_pago | gancho_org | anuncio_ref | audio | trend), texto, semana, ativo.
- `glossary`: termo, definição, oficial (bool), aula. **Seed com os 32 termos oficiais + 7 do app.**
- `agents`: id (AGT-…), nome, modelo, prompt de sistema, versão, temperatura, max tokens, ativo, base usada.
- `ai_usage`: student, agente, modelo, tokens entrada/saída/cache, custo_usd, latência, cache_hit, timestamp.
- `settings`: chave/valor (flags, nomes de modelo, limites, textos editáveis, `PAGE_TOOL_NAME`, links dos modelos do SDM, valores pendentes como verba mínima e regras de pausa).
- `notifications`: agendadas e enviadas.
- `admin_users`: papel (admin | suporte | conteudo) e log de auditoria `audit_log` de toda ação de admin.

RLS: aluna só lê e escreve o que é dela. Admin via service role no servidor, com checagem de papel.

### 5. Telas (todas, iguais ao protótipo)

Implemente **todas** as telas da seção 5 do contexto e do protótipo, com os mesmos IDs como rotas (`/app/...`) e componentes:

- **Acesso**: A01–A07 (login, sem acesso, instalar, boas-vindas, diagnóstico de 8 perguntas, resultado, combinado).
- **Início**: I01–I05 (seu caminho, mapa da trilha, cartões, grupo, ferramentas) e FR01–FR04 (calculadora com comissão % ou fixa, verba do 1º mês, teste de anúncio, rotina com push).
- **Base**: B01–B04 com passo a passo B02 (prints e vídeo vindos do admin).
- **Produtos**: V01 (com estado vazio), V02 vitrine com filtros e favoritos, V03, V04 recomendação com o porquê, V05 painel com etapas 0–6 (+ 7 Ebook), V06 ficha que se preenche sozinha, V07 país, V08 link de afiliada com teste real (abre a URL no servidor, segue redirecionamentos, confere domínio da rede), V09 biblioteca.
- **Entenda**: EN0, EN1, EN4, EN5, EN6 (modelo único, conteúdo editável no admin).
- **Funil**: F01–F08 (seção 3.1 do contexto). F06 busca a página publicada no servidor e roda a conferência.
- **Estratégia**: T01–T03 (libera as trilhas).
- **Divulgação**: DV01 (hub), PG01–PG08, OG01–OG09.
- **Números**: N00–N04 (N02 é o fluxograma guiado; N04 gera 3 variações).
- **Dinheiro e escalar**: DN01–DN05, E01–E04.
- **Ebook (novo)**: EB01–EB06, seção 7.
- **Aulas e apoio**: L01–L06 (player com "Agora faça" que abre a tela certa, materiais, glossário, plantão, PO com cadeado), Q01 professora (texto e print), Q02 suporte humano, U01 perfil.

Regras que valem em todas: menu de baixo com 5 abas (Início, Produtos, Aulas, Professora, Perfil); cabeçalho com voltar respeitando o histórico; etapa bloqueada sempre diz o motivo e o botão que resolve; toast curto de confirmação; desbloqueios exatamente como a seção 4.4 do contexto; aulas PO aparecem nos pontos certos, com cadeado sem entitlement.

### 6. IA: agentes e redução de custo

Agentes (prompt de sistema editável no admin, versionado, com teste numa aluna exemplo):

| Agente | Faz | Telas |
|---|---|---|
| AGT-diagnostico | Interpreta as respostas e monta o resultado (país e trilha sugeridos, com o porquê) | A05, A06 |
| AGT-recomendacao | Ranqueia a vitrine pra aluna e explica o porquê | V03, V04 |
| AGT-montador | Kit da pré-venda (7 blocos) ou do quiz (3 perguntas + resultado), 3 anúncios, 10 roteiros, no idioma do país | F03, F04 |
| AGT-conferencia | Lê a página publicada e confere título, botão com link de afiliada, pixel e regras | F06 |
| AGT-anuncios | Troca gancho, reescreve texto, sugere ajuste de imagem | PG01–PG03 |
| AGT-roteiros | Bio, roteiros, legenda, chamadas, variações | OG02, OG05, OG07, N04 |
| AGT-fichas | "Esse produto vende?" e "desmontando um viral" | V03, OG04 |
| AGT-professora | Responde com o glossário oficial e as aulas (RAG), lê print, cita a aula, nunca decide pela aluna | Q01 |
| AGT-diag-funil | Leitura dos números e próximo ajuste | N01, N02, N04 |
| AGT-ebook | Sumário, capítulos, revisão de capítulo, textos da capa | EB01–EB06 |

**Toda saída de agente** usa **structured outputs** (JSON Schema + Zod), vem no idioma de venda + `pt` + `por_que_funciona` + `checagem` {sem_cara_de_ia, sem_prova_inventada, regras_da_rede, regras_sdm}. Se a checagem falhar, refaz uma vez e depois marca pra revisão.

**Regras de conteúdo nos prompts** (copie da seção 10 do contexto): voz da Amanda, fé com moderação, lista do "nunca" (sem promessa de ganho, cura, prazo, antes e depois, frase que fala da pessoa, perfil falso, especialista falso, copiar vídeo, orientação fiscal), texto sem cara de IA.

**Redução de custo (obrigatório):**
1. **Roteamento por modelo**: modelo mais barato (classe nano/mini) pra professora, fichas, checagens, ganchos e variações; modelo intermediário só pro kit e pro ebook. Nomes de modelo no admin.
2. **Prompt caching**: deixe o prefixo do prompt estável e longo no começo (regras, glossário, voz) e as variáveis no fim, pra aproveitar o cache automático da OpenAI.
3. **Cache de resposta**: hash de (agente + versão + entradas normalizadas). Mesma entrada → devolve do banco, sem chamar a API. Kit e anúncios ficam salvos por pasta e só refazem quando a aluna pede ou o país muda.
4. **Gerar em lote quando faz sentido**: um chamado gera os 3 anúncios + 10 roteiros juntos. Relatório semanal e reprocessamentos no **Batch API**.
5. **RAG barato pra professora**: embeddings (modelo pequeno) do glossário, dos roteiros das aulas e das regras, em `pgvector`. Manda só os 3–5 trechos mais próximos, não a base inteira. Respostas prontas pra perguntas frequentes (top 10 da semana) sem chamar o modelo.
6. **Limites**: `max_output_tokens` por agente, cota diária por aluna (mensagens da professora, imagens, ebooks), configurável no admin. Quando estoura, mostra mensagem gentil e o horário em que volta.
7. **Imagem**: qualidade baixa ou média por padrão, 1 variação por vez (a aluna pede mais), tamanhos fixos (1:1, 4:5, 9:16), cache por hash do prompt, compressão pra WebP no storage. Prévias pequenas, alta só no download.
8. **Print na professora**: reduz a imagem antes de mandar (lado maior 1024 px) e usa detalhe baixo quando der.
9. **Streaming** na professora pra parecer rápido sem custo extra.
10. **Painel de custo** (admin): custo por agente, por aluna, por dia, taxa de cache, alerta quando passar do teto mensal (`settings.ai_budget_usd`).

### 7. Ebook (produto próprio ou bônus)

Fluxo dentro da pasta do produto, telas novas no mesmo padrão visual:

- **EB01 · Entenda**: o que é um produto próprio, quando faz sentido (depois de vender como afiliada), o que ela vai fazer.
- **EB02 · Ideia e promessa**: a IA sugere 3 ideias ligadas ao nicho que ela já divulga (sem copiar o produto do produtor), com o porquê, o público e a promessa. Ela escolhe ou edita.
- **EB03 · Sumário**: 4 a 10 capítulos; reordenar, renomear, tirar, adicionar.
- **EB04 · Opções**: tamanho (5 ou 10 páginas), tom (amiga, profissional, inspirador, didático, persuasivo), idioma (vem do país), tema visual (pelo menos 6, com cores e fontes) e capa.
- **EB05 · Gerando** (job Inngest): capítulo por capítulo, com progresso real na tela e push quando terminar. Se um capítulo falhar, refaz só ele.
- **EB06 · Pronto**: prévia, baixar PDF, mockup da capa, versão em português só pra ela conferir, refazer um capítulo sem refazer tudo, "usar como bônus no perfil".

Geração: sumário e capítulos com structured outputs (título, parágrafos, listas, destaques, exercícios). Capa e ilustrações com a API de imagem (no máximo 1 capa + 1 imagem por capítulo, qualidade configurável). PDF montado com `@react-pdf/renderer` usando o tema escolhido (tipografia, cores, margens, sumário clicável, numeração). Arquivos no Supabase Storage com URL assinada.

### 8. Painel admin (computador, completo)

Rota `/admin`, responsivo, papéis admin, suporte e conteúdo. Reproduza AD01–AD09 do protótipo e acrescente tudo que for preciso pra gerenciar sem mexer em código:

- **AD01 Visão geral**: alunas ativas, funil da jornada (compra → login → instalou → diagnóstico → pasta → link → funil no ar → trilha → campanha/post → 1ª venda), abandono por aula, dúvidas da semana, custo de IA.
- **AD02 Alunas** e **AD03 Ficha**: busca, filtros, tudo da aluna, reenviar acesso, liberar entitlement manual, ver conversas, impersonar em modo leitura.
- **AD04 Agentes**: editar prompt, modelo, temperatura e limites, versionar, comparar versões, testar com aluna exemplo, ver custo por agente.
- **AD05 Aulas**: CRUD de módulos e aulas, upload de vídeo (ou URL), roteiro de 5 blocos, materiais, "Agora faça" e tela ligada, ordem, regra de liberação, marcar pra regravar, publicar o Plantão da semana com push.
- **AD06 Vitrine**: CRUD dos produtos, comissão, selos, pausar.
- **AD07 Bancos da semana**: ganchos, anúncios de referência, áudios, trends.
- **AD08 Acessos e webhooks**: mapa Hubla → entitlement, log de eventos, reprocessar, liberar manual.
- **AD09 Relatório semanal**: top 10 dúvidas (pago e orgânico), 3 aulas com mais abandono, telas que mudaram, exportar CSV/PDF.
- **AD10 Conteúdo do app**: todos os textos das telas Entenda, checklists (CKDEF), passo a passo (PASSOS com prints), avisos da Meta, glossário.
- **AD11 Configurações**: flags (ebook, Hotmart, grupo interno ou externo), nomes de modelo, limites por aluna, teto de custo, `PAGE_TOOL_NAME` e links dos modelos do SDM, valores pendentes (verba mínima, regras de pausa, escada de escala, dias de aprendizado e de aquecimento, frequência de posts).
- **AD12 Custos de IA**: por agente, aluna, dia, cache hit, exportar.
- **AD13 Suporte**: tickets com resposta.
- **Auditoria** de toda ação.

### 9. Integrações

- **OpenAI**: texto, imagem, embeddings, batch (chave `OPENAI_API_KEY`, só servidor).
- **Hubla** (webhook) e **Hotmart** (adaptador desligado).
- **Rastreamento**: uso a chave `TRACKING_API_KEY` de um serviço de rastreamento [me pergunte qual é antes de integrar]. Crie a interface `TrackingProvider` com o evento de clique no link da bio e de venda, e um adaptador vazio até eu confirmar o serviço.
- **Meta / redes**: conexão automática dos números fica pra depois. Faça a interface `MetricsProvider` e o modo manual + print funcionando agora.
- **WhatsApp**: `WhatsAppSender` (seção 3).
- **E-mail**: Supabase Auth (OTP) + um provedor transacional (Resend) pra avisos.
- **Push**: Web Push (rotina, plantão, ebook pronto, aprendizado da campanha, aquecimento).

### 10. Qualidade

- Visual do protótipo: fundo `#0E0C13`, superfície `#17141F`, destaque `#A98BFF`, fonte Plus Jakarta Sans, toque mínimo 44 px, sem emoji na interface, contraste AA. Mobile-first em 390 px.
- Acessibilidade: botões e links reais, rótulo em todo campo, foco visível, `aria-label` em ícones.
- Performance: Server Components onde der, imagens otimizadas, nada de chamada de IA bloqueando a navegação.
- Segurança: chaves só no servidor, RLS, rate limit nas rotas de IA e de login, validação Zod, URL assinada pra arquivos, conferir URLs externas sem seguir pra IP interno (proteção SSRF no teste de link e na conferência da página).
- Testes: unitários das regras de desbloqueio, etapas, cálculo da calculadora, custo por venda e lucro; e2e do caminho completo (login → diagnóstico → pasta → link → kit → conferência → trilha → campanha → números → venda → M7 → ebook).
- Observabilidade: logs estruturados, erro com contexto, `ai_usage` em toda chamada.

### 11. Variáveis de ambiente (crie `.env.example` sem valores)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
OPENAI_API_KEY=
TRACKING_API_KEY=
HUBLA_WEBHOOK_SECRET=
HOTMART_WEBHOOK_SECRET=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
RESEND_API_KEY=
WHATSAPP_PROVIDER=log
WHATSAPP_API_KEY=
ACCESS_LINK_SECRET=
APP_URL=
ADMIN_EMAIL=
```

### 12. Fases (entregue cada uma funcionando, com testes, antes da próxima)

1. **Base**: projeto, Supabase, migrations, seeds (aulas, módulos, glossário, vitrine, checklists, textos), admin inicial, **criação manual de aluna com link de acesso e código por e-mail**, entitlements manuais, PWA e instalação. Webhook Hubla escrito e desligado por flag.
2. **Casca do app**: abas, navegação com histórico, Início, Aulas (grade, player, materiais, glossário, PO), cartões, combinado, grupo, ferramentas, base, perfil, desbloqueios.
3. **Diagnóstico e produto**: A05/A06 com IA, vitrine, recomendação, pastas, país, link de afiliada com teste real, ficha, biblioteca.
4. **Funil**: kit (pré-venda e quiz), monte comigo, conferência da página, teste até o checkout, link da bio com contagem de cliques.
5. **Divulgação e números**: trilhas paga e orgânica, anúncios, imagens, roteiros, calendário, números, fluxogramas, rotina com push.
6. **Dinheiro, escalar e ebook**: venda, M7, planilha de lucro, ebook completo com PDF.
7. **Professora e suporte**: RAG, print, streaming, cotas, tickets.
8. **Admin completo**: AD01–AD13, auditoria, custos.
9. **Endurecimento**: testes e2e, segurança, performance, revisão de custo, documentação (`README` com setup, deploy e como editar conteúdo pelo admin).

Ao terminar cada fase, atualize `docs/ESTADO.md` e `docs/CHANGELOG.md` e me diga em poucas linhas o que ficou pronto, o que está simulado e o que depende de mim (pendências da seção 13 do contexto: ferramenta de página, modelos do SDM, comissão CPA ou %, rede de afiliação, validação da 1ª venda, grupo, provedor de WhatsApp e serviço de rastreamento).
