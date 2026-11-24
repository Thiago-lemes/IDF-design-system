import { describe, expect, it, vi } from "vitest";
import { criarArmazenamento, criarMenuRecolhido, criarTema, type RaizDoTema } from "../src/index.ts";

function bruto(inicial: Record<string, string> = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
  };
}

const quebrado = {
  getItem: () => {
    throw new Error("bloqueado");
  },
  setItem: () => {
    throw new Error("bloqueado");
  },
  removeItem: () => {
    throw new Error("bloqueado");
  },
};

describe("menu recolhido", () => {
  it("começa aberto e lembra a escolha", () => {
    const b = bruto();
    const menu = criarMenuRecolhido({ armazenamento: criarArmazenamento(b) });
    expect(menu.ler()).toBe(false);
    menu.alternar();
    expect(menu.ler()).toBe(true);
    expect(b.dados.get("idf-menu-recolhido")).toBe("1");
    expect(criarMenuRecolhido({ armazenamento: criarArmazenamento(b) }).ler()).toBe(true);
    menu.alternar();
    expect(b.dados.has("idf-menu-recolhido")).toBe(false);
  });

  it("avisa quem assinou, e para de avisar quando cancela", () => {
    const menu = criarMenuRecolhido({ armazenamento: criarArmazenamento(bruto()) });
    const ouvinte = vi.fn();
    const cancelar = menu.assinar(ouvinte);
    menu.definir(true);
    menu.definir(true); // sem mudança, sem aviso
    expect(ouvinte).toHaveBeenCalledTimes(1);
    cancelar();
    menu.definir(false);
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it("sem armazenamento (janela anônima) vale até recarregar, sem quebrar", () => {
    const menu = criarMenuRecolhido({ armazenamento: criarArmazenamento(quebrado) });
    expect(() => menu.alternar()).not.toThrow();
    expect(menu.ler()).toBe(true);
  });
});

describe("tema", () => {
  function raiz(): RaizDoTema {
    return { dataset: {} };
  }

  it("aplica data-tema na raiz e guarda só claro e escuro", () => {
    const b = bruto();
    const r = raiz();
    const tema = criarTema({ armazenamento: criarArmazenamento(b), raiz: r });
    expect(tema.ler()).toBe("sistema");
    expect(r.dataset.tema).toBeUndefined();
    tema.definir("escuro");
    expect(r.dataset.tema).toBe("escuro");
    expect(b.dados.get("idf-tema")).toBe("escuro");
    tema.definir("sistema");
    expect(r.dataset.tema).toBeUndefined();
    expect(b.dados.has("idf-tema")).toBe(false);
  });

  it("aplica na raiz já ao criar, com a escolha guardada", () => {
    const r = raiz();
    criarTema({ armazenamento: criarArmazenamento(bruto({ "idf-tema": "claro" })), raiz: r });
    expect(r.dataset.tema).toBe("claro");
  });

  it("valor guardado inválido volta a seguir o aparelho", () => {
    const tema = criarTema({ armazenamento: criarArmazenamento(bruto({ "idf-tema": "roxo" })) });
    expect(tema.ler()).toBe("sistema");
  });

  it("alterna a partir do que está sendo visto, inclusive quando segue o aparelho", () => {
    let aparelhoEscuro = true;
    const tema = criarTema({ armazenamento: criarArmazenamento(bruto()), raiz: raiz(), prefereEscuro: () => aparelhoEscuro });
    expect(tema.escuroAgora()).toBe(true);
    tema.alternar();
    expect(tema.ler()).toBe("claro");
    tema.alternar();
    expect(tema.ler()).toBe("escuro");
    aparelhoEscuro = false;
    tema.definir("sistema");
    expect(tema.escuroAgora()).toBe(false);
  });

  it("a chave de armazenamento é configurável (um por sistema)", () => {
    const b = bruto();
    criarTema({ armazenamento: criarArmazenamento(b), chave: "secretaria-tema" }).definir("claro");
    expect(b.dados.get("secretaria-tema")).toBe("claro");
  });
});
