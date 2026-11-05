CREATE TABLE "ai_cache" (
	"hash" text PRIMARY KEY NOT NULL,
	"agente" text NOT NULL,
	"versao" integer NOT NULL,
	"saida" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "student_products" ADD COLUMN "tipo" text DEFAULT 'vitrine' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_products" ADD COLUMN "nome" text;--> statement-breakpoint
ALTER TABLE "student_products" ADD COLUMN "dados" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "student_products" ADD COLUMN "divulgacao" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "boas_vindas_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "diagnostico_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "caminho" text;