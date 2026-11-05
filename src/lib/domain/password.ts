import { z } from "zod";

/** Regra de senha: 8+ caracteres, com letra e número. */
export const passwordSchema = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Use pelo menos uma letra.")
  .regex(/\d/, "Use pelo menos um número.");

export const signupSchema = z
  .object({
    nome: z.string().trim().min(2, "Escreva seu nome."),
    email: z.string().trim().toLowerCase().email("Confira o e-mail."),
    senha: passwordSchema,
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { message: "As duas senhas não são iguais.", path: ["confirmar"] });
