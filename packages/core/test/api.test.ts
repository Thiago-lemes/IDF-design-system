import { describe, expect, it, vi } from "vitest";
import { criarCliente, ErroApp } from "../src/index.ts";

function resposta(status: number, corpo?: unknown, cabecalhos: Record<string, string> = {}) {
  const json = corpo !== undefined;
  return new Response(json ? JSON.stringify(corpo) : null, {
    status,
    headers: { ...(json ? { "Content-Type": "application/json" } : {}), ...cabecalhos },
  });
}

function cliente(fetchFalso: typeof fetch) {
  return criarCliente({ cabecalhoCsrf: { nome: "X-Secretaria", valor: "1" }, fetch: fetchFalso });
}

function ultimaChamada(f: ReturnType<typeof vi.fn>) {
  const [url, init] = f.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, cabecalhos: init.headers as Record<string, string> };
}

describe("cliente da API", () => {
  it("envia o cabeçalho anti-CSRF só nas escritas, e sempre o cookie de sessão", async () => {
    const f = vi.fn(async () => resposta(200, { ok: true }));
    const { api } = cliente(f as unknown as typeof fetch);
    await api("/api/x");
    expect(ultimaChamada(f).cabecalhos["X-Secretaria"]).toBeUndefined();
    expect(ultimaChamada(f).init.credentials).toBe("include");
    for (const metodo of ["POST", "PUT", "PATCH", "DELETE"] as const) {
      await api("/api/x", { metodo });
      expect(ultimaChamada(f).cabecalhos["X-Secretaria"]).toBe("1");
    }
  });

  it("o nome e o valor do cabeçalho anti-CSRF são configuráveis", async () => {
    const f = vi.fn(async () => resposta(204));
    await criarCliente({ cabecalhoCsrf: { nome: "X-Outro", valor: "sim" }, fetch: f as unknown as typeof fetch }).api("/a", { metodo: "POST" });
    expect(ultimaChamada(f).cabecalhos["X-Outro"]).toBe("sim");
  });

  it("manda objeto como JSON e Blob como está, com o tipo informado", async () => {
    const f = vi.fn(async () => resposta(204));
    const { api } = cliente(f as unknown as typeof fetch);
    await api("/a", { metodo: "POST", corpo: { a: 1 } });
    expect(ultimaChamada(f).init.body).toBe('{"a":1}');
    expect(ultimaChamada(f).cabecalhos["Content-Type"]).toBe("application/json");
    const png = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    await api("/a", { metodo: "PUT", corpo: png, tipo: "image/png" });
    expect(ultimaChamada(f).init.body).toBe(png);
    expect(ultimaChamada(f).cabecalhos["Content-Type"]).toBe("image/png");
  });

  it("204 devolve undefined", async () => {
    const { api } = cliente((async () => resposta(204)) as unknown as typeof fetch);
    expect(await api("/a", { metodo: "POST" })).toBeUndefined();
  });

  it("Problem Details vira ErroApp com código, requisição e erros de campo", async () => {
    const problema = {
      type: "about:blank",
      title: "Dados inválidos",
      status: 422,
      detail: "Confira os campos.",
      codigo: "VALIDACAO",
      request_id: "SEC-AB12CD",
      erros: [{ campo: "senha", mensagem: "Use pelo menos 10 caracteres" }],
      tentativas: 3,
    };
    const { api } = cliente((async () => resposta(422, problema)) as unknown as typeof fetch);
    const erro = await api("/a", { metodo: "POST" }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroApp);
    expect(erro).toMatchObject({
      status: 422,
      codigo: "VALIDACAO",
      requisicao: "SEC-AB12CD",
      titulo: "Dados inválidos",
      message: "Confira os campos.",
      erros: [{ campo: "senha", mensagem: "Use pelo menos 10 caracteres" }],
      extras: { tentativas: 3 },
    });
  });

  it("sem corpo JSON, usa o X-Request-Id do cabeçalho e uma mensagem padrão em português", async () => {
    const { api } = cliente((async () => new Response("<html>bad gateway</html>", { status: 502, headers: { "X-Request-Id": "REQ-9" } })) as unknown as typeof fetch);
    const erro = (await api("/a").catch((e) => e)) as ErroApp;
    expect(erro.codigo).toBe("ERRO_SERVIDOR");
    expect(erro.requisicao).toBe("REQ-9");
    expect(erro.message).toMatch(/servidor/);
  });

  it("falha de rede vira SEM_CONEXAO com status 0", async () => {
    const { api } = cliente((async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch);
    const erro = (await api("/a").catch((e) => e)) as ErroApp;
    expect(erro).toMatchObject({ status: 0, codigo: "SEM_CONEXAO" });
  });

  it("cancelar a requisição não vira erro de conexão", async () => {
    const { api } = cliente((async () => {
      throw new DOMException("cancelado", "AbortError");
    }) as unknown as typeof fetch);
    const erro = await api("/a").catch((e) => e);
    expect(erro).not.toBeInstanceOf(ErroApp);
  });

  it("baixar devolve o conteúdo e o nome sugerido", async () => {
    const f = async () => new Response("abc", { status: 200, headers: { "Content-Disposition": 'attachment; filename="relatorio.csv"' } });
    const { baixar } = cliente(f as unknown as typeof fetch);
    const { blob, nome } = await baixar("/a");
    expect(nome).toBe("relatorio.csv");
    expect(await blob.text()).toBe("abc");
  });
});
