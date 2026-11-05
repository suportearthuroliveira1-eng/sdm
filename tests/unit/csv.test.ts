import { describe, expect, it } from "vitest";
import { parseStudentsCsv } from "@/lib/domain/csv";

describe("importar CSV", () => {
  it("lê vírgula, aspas e acessos", () => {
    const r = parseStudentsCsv(`nome,email,whatsapp,pais,acessos\n"Souza, Ana",ANA@X.COM,+55 (11) 99999-0000,Portugal,sdm|up1\nBia,bia@x.com,,,`);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ ok: true, data: { nome: "Souza, Ana", email: "ana@x.com", whatsapp: "+5511999990000", pais: "Portugal", acessos: ["sdm", "up1"] } });
    expect(r[1]).toMatchObject({ ok: true, data: { nome: "Bia", acessos: ["sdm"], whatsapp: undefined } });
  });
  it("lê ponto e vírgula e cabeçalho com acento/BOM", () => {
    const r = parseStudentsCsv(`﻿Nome;E-mail;País\nCarla;carla@x.com;Brasil`);
    expect(r[0]).toMatchObject({ ok: true, data: { email: "carla@x.com", pais: "Brasil" } });
  });
  it("aponta linha com erro", () => {
    const r = parseStudentsCsv(`nome,email,acessos\nX,naoemail,sdm\nYasmin,y@x.com,vip`);
    expect(r[0]).toMatchObject({ ok: false, line: 2 });
    expect(r[1]).toMatchObject({ ok: false, line: 3 });
  });
  it("exige colunas nome e email", () => {
    expect(parseStudentsCsv(`a,b\n1,2`)[0]).toMatchObject({ ok: false, line: 1 });
  });
});
