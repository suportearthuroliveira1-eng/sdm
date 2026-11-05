/**
 * Schema completo do SDM (prompt seção 4). Campos de produto seguem o
 * contexto v6 seção 8; quando o contexto chegar, conferir nomes.
 *
 * Convenções:
 * - `id` uuid é a chave real; `code` é o ID legível (ALN-000000 etc.).
 * - Toda tabela tem RLS (migration 0001_rls.sql).
 * - Datas em timestamptz.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// ---------- sequências dos IDs legíveis ----------
export const alnSeq = pgSequence("aln_seq", { startWith: 1 });
export const prdSeq = pgSequence("prd_seq", { startWith: 1 });
export const vitSeq = pgSequence("vit_seq", { startWith: 1 });
export const genSeq = pgSequence("gen_seq", { startWith: 1 });
export const evtSeq = pgSequence("evt_seq", { startWith: 1 });

const code = (prefix: string, seq: string, pad: number) =>
  text("code")
    .notNull()
    .unique()
    .default(sql.raw(`('${prefix}-' || lpad(nextval('${seq}')::text, ${pad}, '0'))`));

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------- enums ----------
export const entitlementProduct = pgEnum("entitlement_product", ["sdm", "up1", "d1", "up2", "d2"]);
export const entitlementStatus = pgEnum("entitlement_status", ["active", "revoked", "refunded", "chargeback", "expired"]);
export const entitlementOrigin = pgEnum("entitlement_origin", ["hubla", "hotmart", "manual"]);
export const funnelType = pgEnum("funnel_type", ["pre", "quiz", "direto"]);
export const genType = pgEnum("gen_type", [
  "kit_pre", "kit_quiz", "anuncio", "gancho", "texto_anuncio", "roteiro", "legenda", "bio",
  "ficha_produto", "ficha_viral", "ebook_outline", "ebook_capitulo", "ebook_pdf", "imagem",
]);
export const genStatus = pgEnum("gen_status", ["rascunho", "aprovado", "publicado", "revisao"]);
export const imageRatio = pgEnum("image_ratio", ["1:1", "4:5", "9:16"]);
export const ebookStatus = pgEnum("ebook_status", ["fila", "gerando", "pronto", "erro"]);
export const moduleUnlockRule = pgEnum("module_unlock_rule", ["compra", "trilha_pago", "trilha_org", "primeira_venda"]);
export const lessonDoneHow = pgEnum("lesson_done_how", ["tela", "ja_fiz", "print"]);
export const metricsSource = pgEnum("metrics_source", ["manual", "print", "conexao"]);
export const commissionType = pgEnum("commission_type", ["pct", "fixo"]);
export const chatRole = pgEnum("chat_role", ["user", "assistant", "system"]);
export const ticketStatus = pgEnum("ticket_status", ["aberto", "respondido", "fechado"]);
export const bankType = pgEnum("bank_type", ["gancho_pago", "gancho_org", "anuncio_ref", "audio", "trend"]);
export const adminRole = pgEnum("admin_role", ["admin", "suporte", "conteudo"]);
export const notificationStatus = pgEnum("notification_status", ["agendada", "enviada", "falhou", "cancelada"]);

// ---------- alunas e acesso ----------
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: code("ALN", "aln_seq", 6),
    /** auth.users.id do Supabase (preenchido no 1º login). */
    authUserId: uuid("auth_user_id").unique(),
    email: text("email").notNull(),
    nome: text("nome").notNull(),
    whatsapp: text("whatsapp"),
    paisMora: text("pais_mora"),
    idiomas: text("idiomas").array().notNull().default(sql`'{}'::text[]`),
    trabalho: text("trabalho"),
    tempoDia: text("tempo_dia"),
    verba: text("verba"),
    assuntos: text("assuntos").array().notNull().default(sql`'{}'::text[]`),
    aparecer: text("aparecer"),
    experiencia: text("experiencia"),
    trilhaPago: boolean("trilha_pago").notNull().default(false),
    trilhaOrg: boolean("trilha_org").notNull().default(false),
    combinadoEm: timestamp("combinado_em", { withTimezone: true }),
    cartoes: jsonb("cartoes").notNull().default(sql`'{}'::jsonb`),
    rotinaHora: text("rotina_hora"),
    rotinaOn: boolean("rotina_on").notNull().default(false),
    pushSubscription: jsonb("push_subscription"),
    produtoAtivo: uuid("produto_ativo"),
    ativo: boolean("ativo").notNull().default(true),
    instaladoEm: timestamp("instalado_em", { withTimezone: true }),
    criadoEm: createdAt(),
    ultimoAcesso: timestamp("ultimo_acesso", { withTimezone: true }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("students_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    produto: entitlementProduct("produto").notNull(),
    status: entitlementStatus("status").notNull().default("active"),
    origem: entitlementOrigin("origem").notNull(),
    externalRef: text("external_ref"),
    inicioEm: timestamp("inicio_em", { withTimezone: true }).notNull().defaultNow(),
    fimEm: timestamp("fim_em", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("entitlements_student_produto_idx").on(t.studentId, t.produto)],
);

/** Links de acesso assinados (uso único, 72h). Guarda só o jti, nunca o token. */
export const accessLinks = pgTable(
  "access_links",
  {
    jti: uuid("jti").primaryKey(),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: createdAt(),
  },
  (t) => [index("access_links_student_idx").on(t.studentId)],
);

export const hublaProductMap = pgTable("hubla_product_map", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("hubla"), // hubla | hotmart
  externalProductId: text("external_product_id").notNull(),
  produto: entitlementProduct("produto").notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("hubla_map_provider_ext_idx").on(t.provider, t.externalProductId)]);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: code("EVT", "evt_seq", 6),
    tipo: text("tipo").notNull(),
    fonte: text("fonte").notNull(), // hubla | hotmart | app | admin
    externalId: text("external_id"),
    payload: jsonb("payload").notNull(),
    processado: boolean("processado").notNull().default(false),
    erro: text("erro"),
    tentativas: integer("tentativas").notNull().default(0),
    createdAt: createdAt(),
    processadoEm: timestamp("processado_em", { withTimezone: true }),
  },
  (t) => [uniqueIndex("events_fonte_external_idx").on(t.fonte, t.externalId)],
);

export const diagnostics = pgTable("diagnostics", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  versao: integer("versao").notNull(),
  respostas: jsonb("respostas").notNull(),
  resultado: jsonb("resultado"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("diagnostics_student_versao_idx").on(t.studentId, t.versao)]);

// ---------- vitrine e pastas ----------
export const vitrineProducts = pgTable("vitrine_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: code("VIT", "vit_seq", 4),
  nome: text("nome").notNull(),
  produtor: text("produtor"),
  redeAfiliacao: text("rede_afiliacao"),
  idioma: text("idioma"),
  paises: text("paises").array().notNull().default(sql`'{}'::text[]`),
  assunto: text("assunto"),
  tipo: text("tipo"),
  resumo: text("resumo"),
  publico: text("publico"),
  dor: text("dor"),
  oQueE: text("o_que_e"),
  promessa: text("promessa"),
  ganchosBase: jsonb("ganchos_base").notNull().default(sql`'[]'::jsonb`),
  promptImagem: text("prompt_imagem"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  seloOrg: boolean("selo_org").notNull().default(false),
  seloAd: boolean("selo_ad").notNull().default(false),
  concorrencia: text("concorrencia"),
  funilIndicado: funnelType("funil_indicado"),
  comissaoTipo: commissionType("comissao_tipo"),
  comissaoValor: numeric("comissao_valor", { precision: 12, scale: 2 }),
  linkPaginaProdutor: text("link_pagina_produtor"),
  dominiosRede: text("dominios_rede").array().notNull().default(sql`'{}'::text[]`),
  /** Versões no idioma de venda + pt: { quem, dor, oque, prom, hooks: {x, pt}, aX, aPt, lang } */
  extra: jsonb("extra").notNull().default(sql`'{}'::jsonb`),
  exemplo: boolean("exemplo").notNull().default(false),
  ativo: boolean("ativo").notNull().default(true),
  ordem: integer("ordem").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const favorites = pgTable("favorites", {
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  vitrineProductId: uuid("vitrine_product_id").notNull().references(() => vitrineProducts.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.studentId, t.vitrineProductId] })]);

export const studentProducts = pgTable(
  "student_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: code("PRD", "prd_seq", 6),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    vitrineProductId: uuid("vitrine_product_id").references(() => vitrineProducts.id),
    paisVenda: text("pais_venda"),
    paisConfirmado: boolean("pais_confirmado").notNull().default(false),
    linkAfiliada: text("link_afiliada"),
    linkTeste: jsonb("link_teste"), // { ok, final_url, dominio, testado_em, erro }
    cartaoAjudaQuem: text("cartao_ajuda_quem"),
    funil: funnelType("funil"),
    urlPagina: text("url_pagina"),
    conferido: boolean("conferido").notNull().default(false),
    conferencia: jsonb("conferencia"),
    publicado: boolean("publicado").notNull().default(false),
    pixelId: text("pixel_id"),
    dataInicioCampanha: date("data_inicio_campanha"),
    redePrincipal: text("rede_principal"),
    handle: text("handle"),
    perfilFeito: boolean("perfil_feito").notNull().default(false),
    formatos: text("formatos").array().notNull().default(sql`'{}'::text[]`),
    planoCampanha: jsonb("plano_campanha"),
    checklists: jsonb("checklists").notNull().default(sql`'{}'::jsonb`),
    etapas: jsonb("etapas").notNull().default(sql`'{}'::jsonb`),
    bioCode: text("bio_code").unique(),
    precisaRefazer: boolean("precisa_refazer").notNull().default(false),
    criadoEm: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("student_products_student_idx").on(t.studentId)],
);

export const generatedItems = pgTable(
  "generated_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: code("GEN", "gen_seq", 6),
    studentProductId: uuid("student_product_id").references(() => studentProducts.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    tipo: genType("tipo").notNull(),
    idioma: text("idioma"),
    conteudo: jsonb("conteudo").notNull(),
    traducaoPt: jsonb("traducao_pt"),
    porQueFunciona: text("por_que_funciona"),
    checagem: jsonb("checagem"),
    status: genStatus("status").notNull().default("rascunho"),
    agente: text("agente").notNull(),
    versao: integer("versao").notNull().default(1),
    hashEntrada: text("hash_entrada"),
    custoUsd: numeric("custo_usd", { precision: 12, scale: 6 }),
    tokens: integer("tokens"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("generated_items_sp_tipo_idx").on(t.studentProductId, t.tipo),
    index("generated_items_hash_idx").on(t.hashEntrada),
  ],
);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  studentProductId: uuid("student_product_id").references(() => studentProducts.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  proporcao: imageRatio("proporcao").notNull(),
  qualidade: text("qualidade").notNull(),
  storagePath: text("storage_path"),
  previewPath: text("preview_path"),
  hash: text("hash").notNull(),
  custo: numeric("custo", { precision: 12, scale: 6 }),
  createdAt: createdAt(),
}, (t) => [index("images_hash_idx").on(t.hash)]);

export const ebooks = pgTable("ebooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  studentProductId: uuid("student_product_id").references(() => studentProducts.id, { onDelete: "cascade" }),
  titulo: text("titulo"),
  idioma: text("idioma"),
  tamanho: integer("tamanho"),
  tom: text("tom"),
  temaVisual: text("tema_visual"),
  ideia: jsonb("ideia"),
  capitulos: jsonb("capitulos").notNull().default(sql`'[]'::jsonb`),
  status: ebookStatus("status").notNull().default("fila"),
  progresso: integer("progresso").notNull().default(0),
  pdfPath: text("pdf_path"),
  capaPath: text("capa_path"),
  mockupPath: text("mockup_path"),
  usoBonus: boolean("uso_bonus").notNull().default(false),
  custo: numeric("custo", { precision: 12, scale: 6 }),
  erro: text("erro"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------- aulas ----------
export const modules = pgTable("modules", {
  id: text("id").primaryKey(), // ex.: M0, M1, PO
  nome: text("nome").notNull(),
  parte: text("parte"),
  objetivo: text("objetivo"),
  regraLiberacao: moduleUnlockRule("regra_liberacao").notNull().default("compra"),
  materiais: jsonb("materiais").notNull().default(sql`'[]'::jsonb`),
  ordem: integer("ordem").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(), // ex.: 0.1, P3.2, PO.1
  moduleId: text("module_id").notNull().references(() => modules.id),
  titulo: text("titulo").notNull(),
  tipo: text("tipo"),
  minutos: integer("minutos"),
  objetivo: text("objetivo"),
  roteiro: jsonb("roteiro").notNull().default(sql`'[]'::jsonb`), // 5 blocos
  agoraFacaTexto: text("agora_faca_texto"),
  agoraFacaAlvo: text("agora_faca_alvo"), // id da tela | fora | pergunta
  videoUrl: text("video_url"),
  materiais: jsonb("materiais").notNull().default(sql`'[]'::jsonb`),
  /** Qualquer um destes libera (ex.: PO = UP1 ou D1). Vazio = só a compra do SDM. */
  requerEntitlements: entitlementProduct("requer_entitlements").array().notNull().default(sql`'{}'::entitlement_product[]`),
  ordem: integer("ordem").notNull().default(0),
  publicada: boolean("publicada").notNull().default(false),
  regravar: boolean("regravar").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const lessonProgress = pgTable("lesson_progress", {
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  pctAssistido: integer("pct_assistido").notNull().default(0),
  vistaEm: timestamp("vista_em", { withTimezone: true }),
  agoraFacaEm: timestamp("agora_faca_em", { withTimezone: true }),
  como: lessonDoneHow("como"),
  updatedAt: updatedAt(),
}, (t) => [primaryKey({ columns: [t.studentId, t.lessonId] })]);

// ---------- números e dinheiro ----------
export const metricsEntries = pgTable("metrics_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProductId: uuid("student_product_id").notNull().references(() => studentProducts.id, { onDelete: "cascade" }),
  data: date("data").notNull(),
  fonte: metricsSource("fonte").notNull(),
  gasto: numeric("gasto", { precision: 12, scale: 2 }),
  cpm: numeric("cpm", { precision: 12, scale: 4 }),
  ctr: numeric("ctr", { precision: 8, scale: 4 }),
  cpc: numeric("cpc", { precision: 12, scale: 4 }),
  vendas: integer("vendas"),
  views: integer("views"),
  retencao: numeric("retencao", { precision: 8, scale: 4 }),
  seguidores: integer("seguidores"),
  comentarios: integer("comentarios"),
  printPath: text("print_path"),
  createdAt: createdAt(),
});

export const linkClicks = pgTable("link_clicks", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  studentProductId: uuid("student_product_id").notNull().references(() => studentProducts.id, { onDelete: "cascade" }),
  rede: text("rede"),
  post: text("post"),
  uaHash: text("ua_hash"),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("link_clicks_sp_ts_idx").on(t.studentProductId, t.ts)]);

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentProductId: uuid("student_product_id").notNull().references(() => studentProducts.id, { onDelete: "cascade" }),
  data: date("data").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }),
  moeda: text("moeda"),
  printPath: text("print_path"),
  validada: boolean("validada").notNull().default(false),
  fonte: text("fonte").notNull().default("manual"),
  createdAt: createdAt(),
});

export const profitWeeks = pgTable("profit_weeks", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  studentProductId: uuid("student_product_id").references(() => studentProducts.id, { onDelete: "cascade" }),
  semana: date("semana").notNull(),
  comissoes: numeric("comissoes", { precision: 12, scale: 2 }).notNull().default("0"),
  gastoAnuncio: numeric("gasto_anuncio", { precision: 12, scale: 2 }).notNull().default("0"),
  outros: numeric("outros", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: createdAt(),
});

// ---------- professora e suporte ----------
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  studentProductId: uuid("student_product_id").references(() => studentProducts.id, { onDelete: "set null" }),
  aulaAtual: text("aula_atual"),
  papel: chatRole("papel").notNull(),
  texto: text("texto").notNull(),
  anexoPath: text("anexo_path"),
  tokens: integer("tokens"),
  custo: numeric("custo", { precision: 12, scale: 6 }),
  createdAt: createdAt(),
}, (t) => [index("chat_messages_student_idx").on(t.studentId, t.createdAt)]);

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  emailContato: text("email_contato"),
  texto: text("texto").notNull(),
  anexoPath: text("anexo_path"),
  status: ticketStatus("status").notNull().default("aberto"),
  resposta: text("resposta"),
  respondidoPor: uuid("respondido_por"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ---------- conteúdo ----------
export const weeklyBanks = pgTable("weekly_banks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: bankType("tipo").notNull(),
  texto: text("texto").notNull(),
  semana: date("semana").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: createdAt(),
});

export const glossary = pgTable("glossary", {
  id: uuid("id").primaryKey().defaultRandom(),
  termo: text("termo").notNull().unique(),
  definicao: text("definicao").notNull(),
  oficial: boolean("oficial").notNull().default(true),
  aula: text("aula"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Textos editáveis do app (Entenda, CKDEF, PASSOS, INFODEF, avisos). */
export const contentBlocks = pgTable("content_blocks", {
  key: text("key").primaryKey(), // ex.: ckdef.link, passos.pixel, entenda.EN1
  kind: text("kind").notNull(), // entenda | checklist | passos | info | aviso | texto
  data: jsonb("data").notNull(),
  updatedAt: updatedAt(),
});

/** Trechos para RAG da professora. Dimensão 1536 = text-embedding-3-small (conferir). */
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  fonte: text("fonte").notNull(), // glossario | aula | regra
  ref: text("ref").notNull(),
  texto: text("texto").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  modelo: text("modelo"),
  hash: text("hash").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("knowledge_chunks_hash_idx").on(t.hash)]);

// ---------- IA ----------
export const agents = pgTable("agents", {
  id: text("id").notNull(), // AGT-diagnostico ...
  versao: integer("versao").notNull(),
  nome: text("nome").notNull(),
  modelo: text("modelo").notNull(),
  promptSistema: text("prompt_sistema").notNull(),
  temperatura: real("temperatura"),
  maxTokens: integer("max_tokens").notNull(),
  ativo: boolean("ativo").notNull().default(false),
  baseUsada: text("base_usada").array().notNull().default(sql`'{}'::text[]`),
  notas: text("notas"),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.id, t.versao] })]);

export const aiUsage = pgTable("ai_usage", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  agente: text("agente").notNull(),
  modelo: text("modelo").notNull(),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),
  tokensCache: integer("tokens_cache").notNull().default(0),
  custoUsd: numeric("custo_usd", { precision: 12, scale: 6 }).notNull().default("0"),
  latenciaMs: integer("latencia_ms"),
  cacheHit: boolean("cache_hit").notNull().default(false),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ai_usage_ts_idx").on(t.ts), index("ai_usage_student_idx").on(t.studentId)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"), // null = ainda não definido
  descricao: text("descricao"),
  grupo: text("grupo").notNull().default("geral"),
  pendente: boolean("pendente").notNull().default(false),
  updatedAt: updatedAt(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // rotina | plantao | ebook | aprendizado | aquecimento
  titulo: text("titulo").notNull(),
  corpo: text("corpo"),
  url: text("url"),
  agendadaPara: timestamp("agendada_para", { withTimezone: true }),
  enviadaEm: timestamp("enviada_em", { withTimezone: true }),
  status: notificationStatus("status").notNull().default("agendada"),
  erro: text("erro"),
  createdAt: createdAt(),
});

// ---------- admin ----------
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").unique(),
  email: text("email").notNull().unique(),
  nome: text("nome"),
  papel: adminRole("papel").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  adminId: uuid("admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  acao: text("acao").notNull(),
  alvoTipo: text("alvo_tipo"),
  alvoId: text("alvo_id"),
  dados: jsonb("dados"),
  ip: text("ip"),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_log_ts_idx").on(t.ts)]);

/** Janela de rate limit simples no Postgres (login, IA). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});
