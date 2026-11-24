/** Estado observável, sem framework. O hook ou o componente do projeto só assina (ex.: `useSyncExternalStore(e.assinar, e.ler)`). */
export type Estado<T> = {
  ler: () => T;
  definir: (novo: T) => void;
  assinar: (ouvinte: () => void) => () => void;
};

export function criarEstado<T>(inicial: T): Estado<T> {
  let valor = inicial;
  const ouvintes = new Set<() => void>();
  return {
    ler: () => valor,
    definir(novo) {
      if (Object.is(valor, novo)) return;
      valor = novo;
      ouvintes.forEach((f) => f());
    },
    assinar(ouvinte) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
  };
}
