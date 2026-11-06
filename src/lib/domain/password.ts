import { randomInt } from "node:crypto";
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

/** Senha provisória fácil de digitar (sem 0/O, 1/l/I): 4 letras + 4 números. Atende a regra (letra + número, 8+). */
export function gerarSenhaProvisoria() {
  const L = "abcdefghjkmnpqrstuvwxyz";
  const N = "23456789";
  const p = (c: string, n: number) => Array.from({ length: n }, () => c[randomInt(c.length)]).join("");
  return `${p(L, 4)}${p(N, 4)}`;
}
