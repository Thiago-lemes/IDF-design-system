export type ErroDeCampo = { campo: string; mensagem: string };

/**
 * Erro da API ou da conexão, já em português para a pessoa. O servidor responde em Problem Details
 * (RFC 9457) com `codigo` estável e `request_id`; aqui `requisicao` é esse `request_id`.
 */
export class ErroApp extends Error {
  readonly titulo: string;
  /** Status HTTP; 0 quando nem chegou ao servidor. */
  readonly status: number;
  /** Código estável (ex.: `SISTEMA_INDISPONIVEL`, `SEM_CONEXAO`) para a tela decidir o que fazer. */
  readonly codigo: string;
  /** O `request_id` do servidor: o mesmo código aparece nos logs dos dois lados. */
  readonly requisicao: string | undefined;
  readonly erros: ErroDeCampo[];
  /** Campos extras do Problem Details. */
  readonly extras: Record<string, unknown>;

  constructor(dados: {
    titulo?: string;
    mensagem: string;
    status: number;
    codigo: string;
    requisicao?: string | undefined;
    erros?: ErroDeCampo[];
    extras?: Record<string, unknown>;
  }) {
    super(dados.mensagem);
    this.name = "ErroApp";
    this.titulo = dados.titulo ?? "Algo deu errado";
    this.status = dados.status;
    this.codigo = dados.codigo;
    this.requisicao = dados.requisicao;
    this.erros = dados.erros ?? [];
    this.extras = dados.extras ?? {};
  }
}

const MAX_LINHAS = 12;

function nomeDoArquivo(caminho: string): string {
  return caminho.split(/[\\/]/).filter(Boolean).pop() ?? "arquivo";
}

/**
 * Limpa a stack antes de exibir ou copiar: tira query string, e-mails, tokens (`Bearer`, `token=`,
 * `sessao=`, JWT) e caminhos do computador, e corta em 12 linhas.
 */
export function limparStack(texto: string, maxLinhas: number = MAX_LINHAS): string {
  return texto
    .split(/\r?\n/)
    .map((linha) =>
      linha
        .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[token]")
        .replace(/\bBearer\s+[\w.~+/=-]+/gi, "Bearer [token]")
        .replace(/\b(token|sessao|secretaria_sessao|senha|password|chave|apikey|jwt)=[^\s&;)]+/gi, "$1=[removido]")
        .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[e-mail]")
        .replace(/(?:[A-Za-z]:\\|\/(?:home|Users|var|opt|app|srv|usr|root)\/)[^\s:)(]*/g, (c) => nomeDoArquivo(c))
        .replace(/(?<=\S)\?[^\s)]+/g, "")
        .trimEnd(),
    )
    .filter((linha) => linha.trim() !== "")
    .slice(0, maxLinhas)
    .join("\n");
}

/** Código curto para a pessoa passar ao suporte quando o servidor não deu um `request_id`. Ex.: `SEC-4F9A21`. */
export function gerarCodigoSuporte(prefixo = "ERR", aleatorio: () => number = Math.random): string {
  let sufixo = "";
  for (let i = 0; i < 6; i++) sufixo += Math.floor(aleatorio() * 16).toString(16).toUpperCase();
  return `${prefixo}-${sufixo}`;
}

export type PainelErro = {
  titulo: string;
  mensagem: string;
  /** O que a pessoa passa ao suporte: o `request_id` do servidor, ou um código gerado aqui. */
  codigo: string;
  status: number | undefined;
  requisicao: string | undefined;
  /** Texto técnico já limpo. `undefined` quando a política não deixa mostrar. */
  detalhes: string | undefined;
};

export type OpcoesPainelErro = {
  /** Prefixo do código gerado no cliente (ex.: `SEC`). */
  prefixo?: string;
  /** Política do sistema: interno mostra a stack; público não (ela vai para o Sentry). */
  mostrarStack?: boolean;
  aleatorio?: () => number;
};

/** Monta o texto técnico: status, código, requisição e a stack limpa. */
export function montarDetalhes(erro: unknown, mostrarStack = true): string {
  const linhas: string[] = [];
  if (erro instanceof ErroApp) {
    if (erro.status) linhas.push(`Status: ${erro.status}`);
    linhas.push(`Código: ${erro.codigo}`);
    if (erro.requisicao) linhas.push(`Requisição: ${erro.requisicao}`);
  }
  if (mostrarStack && erro instanceof Error && erro.stack) linhas.push(limparStack(erro.stack));
  return limparStack(linhas.join("\n"));
}

/**
 * A regra do painel de erro (padrão 5): mensagem clara, código para o suporte e detalhes técnicos
 * sem dado sensível. Qualquer coisa jogada com `throw` vira um painel.
 */
export function montarPainelErro(erro: unknown, opcoes: OpcoesPainelErro = {}): PainelErro {
  const { prefixo = "ERR", mostrarStack = true, aleatorio } = opcoes;
  const app = erro instanceof ErroApp ? erro : undefined;
  const codigo = app?.requisicao ?? gerarCodigoSuporte(prefixo, aleatorio);
  const detalhes = mostrarStack ? montarDetalhes(erro, true) : undefined;
  return {
    titulo: app?.titulo ?? "Algo deu errado",
    mensagem: app?.message ?? "Aconteceu um erro inesperado. Tente de novo; se continuar, avise o suporte.",
    codigo,
    status: app?.status || undefined,
    requisicao: app?.requisicao,
    detalhes: detalhes || undefined,
  };
}
