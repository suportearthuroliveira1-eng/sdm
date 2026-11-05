-- gerado de drizzle/0000_init.sql por pnpm db:supabase. Não edite aqui.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE TYPE "public"."admin_role" AS ENUM('admin', 'suporte', 'conteudo');
CREATE TYPE "public"."bank_type" AS ENUM('gancho_pago', 'gancho_org', 'anuncio_ref', 'audio', 'trend');
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');
CREATE TYPE "public"."commission_type" AS ENUM('pct', 'fixo');
CREATE TYPE "public"."ebook_status" AS ENUM('fila', 'gerando', 'pronto', 'erro');
CREATE TYPE "public"."entitlement_origin" AS ENUM('hubla', 'hotmart', 'manual');
CREATE TYPE "public"."entitlement_product" AS ENUM('sdm', 'up1', 'd1', 'up2', 'd2');
CREATE TYPE "public"."entitlement_status" AS ENUM('active', 'revoked', 'refunded', 'chargeback', 'expired');
CREATE TYPE "public"."funnel_type" AS ENUM('pre', 'quiz', 'direto');
CREATE TYPE "public"."gen_status" AS ENUM('rascunho', 'aprovado', 'publicado', 'revisao');
CREATE TYPE "public"."gen_type" AS ENUM('kit_pre', 'kit_quiz', 'anuncio', 'gancho', 'texto_anuncio', 'roteiro', 'legenda', 'bio', 'ficha_produto', 'ficha_viral', 'ebook_outline', 'ebook_capitulo', 'ebook_pdf', 'imagem');
CREATE TYPE "public"."image_ratio" AS ENUM('1:1', '4:5', '9:16');
CREATE TYPE "public"."lesson_done_how" AS ENUM('tela', 'ja_fiz', 'print');
CREATE TYPE "public"."metrics_source" AS ENUM('manual', 'print', 'conexao');
CREATE TYPE "public"."module_unlock_rule" AS ENUM('compra', 'trilha_pago', 'trilha_org', 'primeira_venda');
CREATE TYPE "public"."notification_status" AS ENUM('agendada', 'enviada', 'falhou', 'cancelada');
CREATE TYPE "public"."ticket_status" AS ENUM('aberto', 'respondido', 'fechado');
CREATE SEQUENCE "public"."aln_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE SEQUENCE "public"."evt_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE SEQUENCE "public"."gen_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE SEQUENCE "public"."prd_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE SEQUENCE "public"."vit_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;
CREATE TABLE "access_links" (
	"jti" uuid PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"email" text NOT NULL,
	"nome" text,
	"papel" "admin_role" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);

CREATE TABLE "agents" (
	"id" text NOT NULL,
	"versao" integer NOT NULL,
	"nome" text NOT NULL,
	"modelo" text NOT NULL,
	"prompt_sistema" text NOT NULL,
	"temperatura" real,
	"max_tokens" integer NOT NULL,
	"ativo" boolean DEFAULT false NOT NULL,
	"base_usada" text[] DEFAULT '{}'::text[] NOT NULL,
	"notas" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_id_versao_pk" PRIMARY KEY("id","versao")
);

CREATE TABLE "ai_usage" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_usage_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"student_id" uuid,
	"agente" text NOT NULL,
	"modelo" text NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"tokens_cache" integer DEFAULT 0 NOT NULL,
	"custo_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"latencia_ms" integer,
	"cache_hit" boolean DEFAULT false NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"admin_id" uuid,
	"acao" text NOT NULL,
	"alvo_tipo" text,
	"alvo_id" text,
	"dados" jsonb,
	"ip" text,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"student_product_id" uuid,
	"aula_atual" text,
	"papel" "chat_role" NOT NULL,
	"texto" text NOT NULL,
	"anexo_path" text,
	"tokens" integer,
	"custo" numeric(12, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "content_blocks" (
	"key" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"versao" integer NOT NULL,
	"respostas" jsonb NOT NULL,
	"resultado" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "ebooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"student_product_id" uuid,
	"titulo" text,
	"idioma" text,
	"tamanho" integer,
	"tom" text,
	"tema_visual" text,
	"ideia" jsonb,
	"capitulos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "ebook_status" DEFAULT 'fila' NOT NULL,
	"progresso" integer DEFAULT 0 NOT NULL,
	"pdf_path" text,
	"capa_path" text,
	"mockup_path" text,
	"uso_bonus" boolean DEFAULT false NOT NULL,
	"custo" numeric(12, 6),
	"erro" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"produto" "entitlement_product" NOT NULL,
	"status" "entitlement_status" DEFAULT 'active' NOT NULL,
	"origem" "entitlement_origin" NOT NULL,
	"external_ref" text,
	"inicio_em" timestamp with time zone DEFAULT now() NOT NULL,
	"fim_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT ('EVT-' || lpad(nextval('evt_seq')::text, 6, '0')) NOT NULL,
	"tipo" text NOT NULL,
	"fonte" text NOT NULL,
	"external_id" text,
	"payload" jsonb NOT NULL,
	"processado" boolean DEFAULT false NOT NULL,
	"erro" text,
	"tentativas" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processado_em" timestamp with time zone,
	CONSTRAINT "events_code_unique" UNIQUE("code")
);

CREATE TABLE "favorites" (
	"student_id" uuid NOT NULL,
	"vitrine_product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_student_id_vitrine_product_id_pk" PRIMARY KEY("student_id","vitrine_product_id")
);

CREATE TABLE "generated_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT ('GEN-' || lpad(nextval('gen_seq')::text, 6, '0')) NOT NULL,
	"student_product_id" uuid,
	"student_id" uuid NOT NULL,
	"tipo" "gen_type" NOT NULL,
	"idioma" text,
	"conteudo" jsonb NOT NULL,
	"traducao_pt" jsonb,
	"por_que_funciona" text,
	"checagem" jsonb,
	"status" "gen_status" DEFAULT 'rascunho' NOT NULL,
	"agente" text NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"hash_entrada" text,
	"custo_usd" numeric(12, 6),
	"tokens" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_items_code_unique" UNIQUE("code")
);

CREATE TABLE "glossary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"termo" text NOT NULL,
	"definicao" text NOT NULL,
	"oficial" boolean DEFAULT true NOT NULL,
	"aula" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_termo_unique" UNIQUE("termo")
);

CREATE TABLE "hubla_product_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'hubla' NOT NULL,
	"external_product_id" text NOT NULL,
	"produto" "entitlement_product" NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"student_product_id" uuid,
	"prompt" text NOT NULL,
	"proporcao" "image_ratio" NOT NULL,
	"qualidade" text NOT NULL,
	"storage_path" text,
	"preview_path" text,
	"hash" text NOT NULL,
	"custo" numeric(12, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fonte" text NOT NULL,
	"ref" text NOT NULL,
	"texto" text NOT NULL,
	"embedding" vector(1536),
	"modelo" text,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "lesson_progress" (
	"student_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"pct_assistido" integer DEFAULT 0 NOT NULL,
	"vista_em" timestamp with time zone,
	"agora_faca_em" timestamp with time zone,
	"como" "lesson_done_how",
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_student_id_lesson_id_pk" PRIMARY KEY("student_id","lesson_id")
);

CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text,
	"minutos" integer,
	"objetivo" text,
	"roteiro" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"agora_faca_texto" text,
	"agora_faca_alvo" text,
	"video_url" text,
	"materiais" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requer_entitlement" "entitlement_product",
	"ordem" integer DEFAULT 0 NOT NULL,
	"publicada" boolean DEFAULT false NOT NULL,
	"regravar" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "link_clicks" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "link_clicks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"student_product_id" uuid NOT NULL,
	"rede" text,
	"post" text,
	"ua_hash" text,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "metrics_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_product_id" uuid NOT NULL,
	"data" date NOT NULL,
	"fonte" "metrics_source" NOT NULL,
	"gasto" numeric(12, 2),
	"cpm" numeric(12, 4),
	"ctr" numeric(8, 4),
	"cpc" numeric(12, 4),
	"vendas" integer,
	"views" integer,
	"retencao" numeric(8, 4),
	"seguidores" integer,
	"comentarios" integer,
	"print_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"parte" text,
	"objetivo" text,
	"regra_liberacao" "module_unlock_rule" DEFAULT 'compra' NOT NULL,
	"materiais" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"corpo" text,
	"url" text,
	"agendada_para" timestamp with time zone,
	"enviada_em" timestamp with time zone,
	"status" "notification_status" DEFAULT 'agendada' NOT NULL,
	"erro" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "profit_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"student_product_id" uuid,
	"semana" date NOT NULL,
	"comissoes" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gasto_anuncio" numeric(12, 2) DEFAULT '0' NOT NULL,
	"outros" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_product_id" uuid NOT NULL,
	"data" date NOT NULL,
	"valor" numeric(12, 2),
	"moeda" text,
	"print_path" text,
	"validada" boolean DEFAULT false NOT NULL,
	"fonte" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"descricao" text,
	"grupo" text DEFAULT 'geral' NOT NULL,
	"pendente" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "student_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT ('PRD-' || lpad(nextval('prd_seq')::text, 6, '0')) NOT NULL,
	"student_id" uuid NOT NULL,
	"vitrine_product_id" uuid,
	"pais_venda" text,
	"pais_confirmado" boolean DEFAULT false NOT NULL,
	"link_afiliada" text,
	"link_teste" jsonb,
	"cartao_ajuda_quem" text,
	"funil" "funnel_type",
	"url_pagina" text,
	"conferido" boolean DEFAULT false NOT NULL,
	"conferencia" jsonb,
	"publicado" boolean DEFAULT false NOT NULL,
	"pixel_id" text,
	"data_inicio_campanha" date,
	"rede_principal" text,
	"handle" text,
	"perfil_feito" boolean DEFAULT false NOT NULL,
	"formatos" text[] DEFAULT '{}'::text[] NOT NULL,
	"plano_campanha" jsonb,
	"checklists" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"etapas" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"bio_code" text,
	"precisa_refazer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_products_code_unique" UNIQUE("code"),
	CONSTRAINT "student_products_bio_code_unique" UNIQUE("bio_code")
);

CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT ('ALN-' || lpad(nextval('aln_seq')::text, 6, '0')) NOT NULL,
	"auth_user_id" uuid,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"whatsapp" text,
	"pais_mora" text,
	"idiomas" text[] DEFAULT '{}'::text[] NOT NULL,
	"trabalho" text,
	"tempo_dia" text,
	"verba" text,
	"assuntos" text[] DEFAULT '{}'::text[] NOT NULL,
	"aparecer" text,
	"experiencia" text,
	"trilha_pago" boolean DEFAULT false NOT NULL,
	"trilha_org" boolean DEFAULT false NOT NULL,
	"combinado_em" timestamp with time zone,
	"cartoes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rotina_hora" text,
	"rotina_on" boolean DEFAULT false NOT NULL,
	"push_subscription" jsonb,
	"produto_ativo" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	"instalado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_acesso" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_code_unique" UNIQUE("code"),
	CONSTRAINT "students_auth_user_id_unique" UNIQUE("auth_user_id")
);

CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid,
	"email_contato" text,
	"texto" text NOT NULL,
	"anexo_path" text,
	"status" "ticket_status" DEFAULT 'aberto' NOT NULL,
	"resposta" text,
	"respondido_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "vitrine_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT ('VIT-' || lpad(nextval('vit_seq')::text, 4, '0')) NOT NULL,
	"nome" text NOT NULL,
	"produtor" text,
	"rede_afiliacao" text,
	"idioma" text,
	"paises" text[] DEFAULT '{}'::text[] NOT NULL,
	"assunto" text,
	"tipo" text,
	"resumo" text,
	"publico" text,
	"dor" text,
	"o_que_e" text,
	"promessa" text,
	"ganchos_base" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prompt_imagem" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"selo_org" boolean DEFAULT false NOT NULL,
	"selo_ad" boolean DEFAULT false NOT NULL,
	"concorrencia" text,
	"funil_indicado" "funnel_type",
	"comissao_tipo" "commission_type",
	"comissao_valor" numeric(12, 2),
	"link_pagina_produtor" text,
	"dominios_rede" text[] DEFAULT '{}'::text[] NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vitrine_products_code_unique" UNIQUE("code")
);

CREATE TABLE "weekly_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "bank_type" NOT NULL,
	"texto" text NOT NULL,
	"semana" date NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "access_links" ADD CONSTRAINT "access_links_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ebooks" ADD CONSTRAINT "ebooks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "ebooks" ADD CONSTRAINT "ebooks_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_vitrine_product_id_vitrine_products_id_fk" FOREIGN KEY ("vitrine_product_id") REFERENCES "public"."vitrine_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "generated_items" ADD CONSTRAINT "generated_items_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "generated_items" ADD CONSTRAINT "generated_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "images" ADD CONSTRAINT "images_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "images" ADD CONSTRAINT "images_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "link_clicks" ADD CONSTRAINT "link_clicks_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "metrics_entries" ADD CONSTRAINT "metrics_entries_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "profit_weeks" ADD CONSTRAINT "profit_weeks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "profit_weeks" ADD CONSTRAINT "profit_weeks_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales" ADD CONSTRAINT "sales_student_product_id_student_products_id_fk" FOREIGN KEY ("student_product_id") REFERENCES "public"."student_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_products" ADD CONSTRAINT "student_products_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_products" ADD CONSTRAINT "student_products_vitrine_product_id_vitrine_products_id_fk" FOREIGN KEY ("vitrine_product_id") REFERENCES "public"."vitrine_products"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "access_links_student_idx" ON "access_links" USING btree ("student_id");
CREATE INDEX "ai_usage_ts_idx" ON "ai_usage" USING btree ("ts");
CREATE INDEX "ai_usage_student_idx" ON "ai_usage" USING btree ("student_id");
CREATE INDEX "audit_log_ts_idx" ON "audit_log" USING btree ("ts");
CREATE INDEX "chat_messages_student_idx" ON "chat_messages" USING btree ("student_id","created_at");
CREATE UNIQUE INDEX "diagnostics_student_versao_idx" ON "diagnostics" USING btree ("student_id","versao");
CREATE UNIQUE INDEX "entitlements_student_produto_idx" ON "entitlements" USING btree ("student_id","produto");
CREATE UNIQUE INDEX "events_fonte_external_idx" ON "events" USING btree ("fonte","external_id");
CREATE INDEX "generated_items_sp_tipo_idx" ON "generated_items" USING btree ("student_product_id","tipo");
CREATE INDEX "generated_items_hash_idx" ON "generated_items" USING btree ("hash_entrada");
CREATE UNIQUE INDEX "hubla_map_provider_ext_idx" ON "hubla_product_map" USING btree ("provider","external_product_id");
CREATE INDEX "images_hash_idx" ON "images" USING btree ("hash");
CREATE UNIQUE INDEX "knowledge_chunks_hash_idx" ON "knowledge_chunks" USING btree ("hash");
CREATE INDEX "link_clicks_sp_ts_idx" ON "link_clicks" USING btree ("student_product_id","ts");
CREATE INDEX "student_products_student_idx" ON "student_products" USING btree ("student_id");
CREATE UNIQUE INDEX "students_email_lower_idx" ON "students" USING btree (lower("email"));