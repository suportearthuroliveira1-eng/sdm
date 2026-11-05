import { describe, expect, it } from "vitest";
import { passwordSchema, signupSchema } from "@/lib/domain/password";

describe("senha", () => {
  it("exige 8+ caracteres com letra e número", () => {
    expect(passwordSchema.safeParse("abc12345").success).toBe(true);
    expect(passwordSchema.safeParse("abc123").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });
  it("cadastro confere as duas senhas e normaliza o e-mail", () => {
    const ok = signupSchema.safeParse({ nome: "Ana", email: " ANA@X.com ", senha: "abc12345", confirmar: "abc12345" });
    expect(ok.success && ok.data.email).toBe("ana@x.com");
    const ruim = signupSchema.safeParse({ nome: "Ana", email: "ana@x.com", senha: "abc12345", confirmar: "abc12346" });
    expect(ruim.success).toBe(false);
    expect(ruim.error?.issues[0]?.message).toBe("As duas senhas não são iguais.");
  });
});
