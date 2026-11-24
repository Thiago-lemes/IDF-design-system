import type { Armazenamento } from "./armazenamento.ts";
import { criarEstado } from "./estado.ts";

/** `sistema` segue o aparelho; `claro` e `escuro` são escolhas explícitas. */
export type Tema = "sistema" | "claro" | "escuro";

/** O elemento raiz (`document.documentElement`). Só o `dataset` é usado: `data-tema="claro" | "escuro"`. */
export type RaizDoTema = { dataset: Record<string, string | undefined> };

export type ControladorTema = {
  ler: () => Tema;
  assinar: (ouvinte: () => void) => () => void;
  definir: (tema: Tema) => void;
  /** Se o tema que a pessoa está vendo agora é o escuro (considera a preferência do aparelho). */
  escuroAgora: () => boolean;
  /** Troca entre claro e escuro a partir do que está sendo visto. */
  alternar: () => void;
};

function valido(valor: string | null): Tema {
  return valor === "claro" || valor === "escuro" ? valor : "sistema";
}

/**
 * Controlador do tema claro/escuro (padrão 2). Aplica o atributo `data-tema` na raiz (o CSS de
 * `@idf/ui` e o tema do produto reagem a ele) e guarda a escolha só neste navegador.
 */
export function criarTema(opcoes: {
  armazenamento: Armazenamento;
  raiz?: RaizDoTema | null;
  chave?: string;
  /** Preferência do aparelho (`matchMedia("(prefers-color-scheme: dark)").matches`). */
  prefereEscuro?: () => boolean;
}): ControladorTema {
  const chave = opcoes.chave ?? "idf-tema";
  const prefereEscuro = opcoes.prefereEscuro ?? (() => false);
  const estado = criarEstado<Tema>(valido(opcoes.armazenamento.ler(chave)));

  function aplicar(tema: Tema) {
    const raiz = opcoes.raiz;
    if (!raiz) return;
    if (tema === "sistema") delete raiz.dataset.tema;
    else raiz.dataset.tema = tema;
  }
  aplicar(estado.ler());

  function definir(tema: Tema) {
    if (tema === "sistema") opcoes.armazenamento.remover(chave);
    else opcoes.armazenamento.escrever(chave, tema);
    aplicar(tema);
    estado.definir(tema);
  }
  const escuroAgora = () => {
    const t = estado.ler();
    return t === "escuro" || (t === "sistema" && prefereEscuro());
  };
  return {
    ler: estado.ler,
    assinar: estado.assinar,
    definir,
    escuroAgora,
    alternar: () => definir(escuroAgora() ? "claro" : "escuro"),
  };
}
