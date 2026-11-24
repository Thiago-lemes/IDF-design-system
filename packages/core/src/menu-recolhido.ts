import type { Armazenamento } from "./armazenamento.ts";
import { criarEstado } from "./estado.ts";

export type MenuRecolhido = {
  /** `true` quando o menu lateral do computador está recolhido numa faixa de ícones. */
  ler: () => boolean;
  assinar: (ouvinte: () => void) => () => void;
  definir: (recolhido: boolean) => void;
  alternar: () => void;
};

/** Controlador do menu lateral (padrão 1). A escolha fica só neste navegador. */
export function criarMenuRecolhido(opcoes: { armazenamento: Armazenamento; chave?: string }): MenuRecolhido {
  const chave = opcoes.chave ?? "idf-menu-recolhido";
  const estado = criarEstado(opcoes.armazenamento.ler(chave) === "1");
  function definir(recolhido: boolean) {
    if (recolhido) opcoes.armazenamento.escrever(chave, "1");
    else opcoes.armazenamento.remover(chave);
    estado.definir(recolhido);
  }
  return {
    ler: estado.ler,
    assinar: estado.assinar,
    definir,
    alternar: () => definir(!estado.ler()),
  };
}
