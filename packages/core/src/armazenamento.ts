/** O que o núcleo precisa de um armazenamento (o `localStorage` serve). */
export type ArmazenamentoBruto = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type Armazenamento = {
  ler: (chave: string) => string | null;
  escrever: (chave: string, valor: string) => void;
  remover: (chave: string) => void;
};

/**
 * Envolve um armazenamento que pode falhar (janela anônima, dados bloqueados). Se falhar, o valor
 * vale só até recarregar a página, na memória. Nunca guarde token nem dado pessoal aqui.
 */
export function criarArmazenamento(bruto: ArmazenamentoBruto | null | undefined): Armazenamento {
  const memoria = new Map<string, string>();
  return {
    ler(chave) {
      try {
        if (bruto) return bruto.getItem(chave);
      } catch {
        // cai na memória
      }
      return memoria.get(chave) ?? null;
    },
    escrever(chave, valor) {
      memoria.set(chave, valor);
      try {
        bruto?.setItem(chave, valor);
      } catch {
        // vale até recarregar
      }
    },
    remover(chave) {
      memoria.delete(chave);
      try {
        bruto?.removeItem(chave);
      } catch {
        // vale até recarregar
      }
    },
  };
}

/** O armazenamento do navegador, ou só memória onde ele não existe ou nem pode ser lido. */
export function armazenamentoDoNavegador(): Armazenamento {
  let bruto: Storage | null = null;
  try {
    bruto = typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    bruto = null;
  }
  return criarArmazenamento(bruto);
}
