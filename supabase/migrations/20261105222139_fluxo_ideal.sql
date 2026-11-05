-- gerado de drizzle/0006_fluxo_ideal.sql por pnpm db:supabase. Não edite aqui.
CREATE TABLE "ai_cache" (
	"hash" text PRIMARY KEY NOT NULL,
	"agente" text NOT NULL,
	"versao" integer NOT NULL,
	"saida" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "kit_pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"texto" text,
	"idioma" text DEFAULT 'pt' NOT NULL,
	"arquivo_path" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "student_products" ADD COLUMN "tipo" text DEFAULT 'vitrine' NOT NULL;
ALTER TABLE "student_products" ADD COLUMN "nome" text;
ALTER TABLE "student_products" ADD COLUMN "dados" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "student_products" ADD COLUMN "divulgacao" text;
ALTER TABLE "students" ADD COLUMN "boas_vindas_em" timestamp with time zone;
ALTER TABLE "students" ADD COLUMN "diagnostico_em" timestamp with time zone;
ALTER TABLE "students" ADD COLUMN "caminho" text;