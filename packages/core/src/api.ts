import { ErroApp, type ErroDeCampo } from "./erros.ts";

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type OpcoesCliente = {
  /** Cabeçalho anti-CSRF (ex.: `{ nome: "X-Secretaria", valor: "1" }`), enviado em toda escrita. Sem ele, nenhum. */
  cabecalhoCsrf?: { nome: string; valor: string };
  /** Prefixo das rotas (padrão: nenhum). */
  base?: string;
  /** Troca o `fetch` (testes). Por padrão usa o `fetch` global no momento da chamada. */
  fetch?: typeof fetch;
};

export type OpcoesRequisicao = {
  metodo?: Metodo;
  /** Objeto vira JSON. `Blob`, `ArrayBuffer` e texto vão como estão, com o `tipo` informado. */
  corpo?: unknown;
  /** `Content-Type` do corpo quando ele não é JSON. */
  tipo?: string;
  cabecalhos?: Record<string, string>;
  sinal?: AbortSignal;
};

export type ClienteApi = {
  api: <T>(caminho: string, opcoes?: OpcoesRequisicao) => Promise<T>;
  /** Baixa um arquivo (corpo que não é JSON): o conteúdo e o nome sugerido pela API. */
  baixar: (caminho: string, opcoes?: OpcoesRequisicao) => Promise<{ blob: Blob; nome: string }>;
};

const MENSAGEM_SEM_CONEXAO = "Sem conexão com o servidor. Verifique a internet e tente de novo.";

function mensagemPadrao(status: number): string {
  if (status === 401) return "Sua sessão terminou. Entre de novo.";
  if (status === 403) return "Você não tem permissão para isso.";
  if (status === 404) return "Não encontramos o que você procurou.";
  if (status >= 500) return "O servidor não conseguiu responder agora. Tente de novo em instantes.";
  return "Não foi possível completar a ação.";
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Converte o corpo de erro (Problem Details) em `ErroApp`. Aceita corpo ausente ou que não é JSON. */
export function erroDaResposta(status: number, dados: unknown, requisicaoDoCabecalho?: string | null): ErroApp {
  const corpo = ehObjeto(dados) ? dados : {};
  const { type: _type, title, status: _status, detail, codigo, request_id, erros, ...extras } = corpo;
  void _type;
  void _status;
  const texto = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const requisicao = texto(request_id) ?? requisicaoDoCabecalho ?? undefined;
  return new ErroApp({
    titulo: texto(title),
    mensagem: texto(detail) ?? texto(title) ?? mensagemPadrao(status),
    status,
    codigo: texto(codigo) ?? (status >= 500 ? "ERRO_SERVIDOR" : "ERRO"),
    requisicao,
    erros: Array.isArray(erros) ? (erros.filter(ehObjeto) as unknown as ErroDeCampo[]) : [],
    extras,
  });
}

/**
 * Cliente da API do projeto. Envia o cookie de sessão (`credentials: "include"`) e o cabeçalho
 * anti-CSRF nas escritas, converte Problem Details em `ErroApp` e **nunca guarda token**.
 */
export function criarCliente(opcoes: OpcoesCliente = {}): ClienteApi {
  const base = opcoes.base ?? "";

  async function enviar(caminho: string, o: OpcoesRequisicao): Promise<Response> {
    const metodo = o.metodo ?? "GET";
    const cabecalhos: Record<string, string> = { Accept: "application/json, application/problem+json", ...o.cabecalhos };
    if (metodo !== "GET" && opcoes.cabecalhoCsrf) cabecalhos[opcoes.cabecalhoCsrf.nome] = opcoes.cabecalhoCsrf.valor;

    let corpo: BodyInit | undefined;
    if (o.corpo !== undefined) {
      const bruto = o.corpo instanceof Blob || o.corpo instanceof ArrayBuffer || typeof o.corpo === "string";
      corpo = bruto ? (o.corpo as BodyInit) : JSON.stringify(o.corpo);
      cabecalhos["Content-Type"] = bruto ? (o.tipo ?? "application/octet-stream") : "application/json";
    }
    const chamar = opcoes.fetch ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
    try {
      return await chamar(base + caminho, { method: metodo, credentials: "include", headers: cabecalhos, body: corpo, signal: o.sinal ?? null });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      throw new ErroApp({ titulo: "Sem conexão", mensagem: MENSAGEM_SEM_CONEXAO, status: 0, codigo: "SEM_CONEXAO" });
    }
  }

  async function falhar(resposta: Response): Promise<never> {
    const dados: unknown = await resposta.json().catch(() => null);
    throw erroDaResposta(resposta.status, dados, resposta.headers.get("X-Request-Id"));
  }

  return {
    async api<T>(caminho: string, o: OpcoesRequisicao = {}): Promise<T> {
      const resposta = await enviar(caminho, o);
      if (!resposta.ok) return falhar(resposta);
      if (resposta.status === 204) return undefined as T;
      if (!(resposta.headers.get("Content-Type") ?? "").includes("json")) return undefined as T;
      return (await resposta.json()) as T;
    },
    async baixar(caminho, o = {}) {
      const resposta = await enviar(caminho, o);
      if (!resposta.ok) return falhar(resposta);
      const nome = /filename="([^"]+)"/.exec(resposta.headers.get("Content-Disposition") ?? "")?.[1] ?? "arquivo";
      return { blob: await resposta.blob(), nome };
    },
  };
}
