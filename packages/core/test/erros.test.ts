import { describe, expect, it } from "vitest";
import { ErroApp, gerarCodigoSuporte, limparStack, montarPainelErro } from "../src/index.ts";

describe("limparStack", () => {
  it("tira a query string das URLs", () => {
    expect(limparStack("at fetch (https://hub.exemplo.org/api/x?token=abc&b=1)")).toBe("at fetch (https://hub.exemplo.org/api/x)");
  });

  it("tira e-mails", () => {
    expect(limparStack("falhou para maria@exemplo.org agora")).toBe("falhou para [e-mail] agora");
  });

  it("tira tokens: Bearer, token=, sessao= e JWT", () => {
    const saida = limparStack(
      "Authorization: Bearer abc.def-123\nsessao=xyz987 e token=qwe\neyJhbGciOi.eyJzdWIiOi.assinatura",
    );
    expect(saida).not.toMatch(/abc\.def|xyz987|qwe|eyJhbGci/);
    expect(saida).toContain("Bearer [token]");
    expect(saida).toContain("sessao=[removido]");
  });

  it("troca caminhos do computador só pelo nome do arquivo", () => {
    const saida = limparStack("at x (C:\\Users\\maria\\proj\\src\\tela.tsx:10:5)\nat y (/home/ana/app/src/api.ts:3:1)");
    expect(saida).toBe("at x (tela.tsx:10:5)\nat y (api.ts:3:1)");
  });

  it("corta em 12 linhas e ignora linhas vazias", () => {
    const longo = Array.from({ length: 30 }, (_, i) => `linha ${i}\n`).join("\n");
    expect(limparStack(longo).split("\n")).toHaveLength(12);
  });

  it("não come pontos de interrogação do texto normal", () => {
    expect(limparStack("Deu certo? Sim.")).toBe("Deu certo? Sim.");
  });
});

describe("gerarCodigoSuporte", () => {
  it("tem prefixo e seis dígitos hexadecimais em maiúsculas", () => {
    expect(gerarCodigoSuporte("SEC")).toMatch(/^SEC-[0-9A-F]{6}$/);
  });
  it("é determinístico com um sorteio fixo", () => {
    expect(gerarCodigoSuporte("SEC", () => 0.5)).toBe("SEC-888888");
  });
});

describe("montarPainelErro", () => {
  const erro = new ErroApp({
    titulo: "Sistema fora do ar",
    mensagem: "Não foi possível consultar o Kids IDF.",
    status: 503,
    codigo: "SISTEMA_INDISPONIVEL",
    requisicao: "SEC-4F9A21",
  });

  it("usa o request_id do servidor como código de suporte", () => {
    const painel = montarPainelErro(erro, { prefixo: "SEC" });
    expect(painel.codigo).toBe("SEC-4F9A21");
    expect(painel.titulo).toBe("Sistema fora do ar");
    expect(painel.status).toBe(503);
    expect(painel.detalhes).toContain("Código: SISTEMA_INDISPONIVEL");
    expect(painel.detalhes).toContain("Requisição: SEC-4F9A21");
  });

  it("gera um código quando o servidor não deu requisição", () => {
    const painel = montarPainelErro(new Error("quebrou"), { prefixo: "SEC" });
    expect(painel.codigo).toMatch(/^SEC-[0-9A-F]{6}$/);
    expect(painel.mensagem).toMatch(/erro inesperado/);
  });

  it("não mostra detalhes quando a política (sistema público) não deixa", () => {
    expect(montarPainelErro(erro, { mostrarStack: false }).detalhes).toBeUndefined();
  });

  it("os detalhes saem sem dado sensível", () => {
    const e = new Error("falhou para ana@exemplo.org com token=segredo");
    const painel = montarPainelErro(e);
    expect(painel.detalhes).not.toMatch(/ana@exemplo|segredo/);
  });
});
