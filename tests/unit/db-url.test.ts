import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { urlDoBanco } = await import("@/lib/db");

describe("urlDoBanco", () => {
  it("troca o pooler em modo transação (6543) pelo modo sessão (5432)", () => {
    expect(urlDoBanco("postgresql://u.ref:s%2Ah@aws-1-us-west-2.pooler.supabase.com:6543/postgres")).toBe(
      "postgresql://u.ref:s%2Ah@aws-1-us-west-2.pooler.supabase.com:5432/postgres",
    );
  });
  it("não mexe em banco local nem em outra porta", () => {
    expect(urlDoBanco("postgres://sdm:sdm@localhost/sdm_test")).toBe("postgres://sdm:sdm@localhost/sdm_test");
    expect(urlDoBanco("postgresql://u:p@db.x.supabase.co:5432/postgres")).toBe("postgresql://u:p@db.x.supabase.co:5432/postgres");
  });
});
