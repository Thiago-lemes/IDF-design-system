import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dir = new URL("../src/shell/", import.meta.url);
const shell = readFileSync(new URL("shell.css", dir), "utf8");
const primitivos = readFileSync(new URL("primitivos.css", dir), "utf8");

test("o shell tem os pontos de corte do padrão: 700 e 1024 px", () => {
  assert.match(shell, /min-width:\s*1024px/);
  assert.match(shell, /max-width:\s*699px/);
  assert.match(shell, /--idf-menu-largura:\s*236px/);
  assert.match(shell, /padding-left:\s*80px/);
});

test("menu recolhido e itens por celular são atributos data-*", () => {
  assert.match(shell, /\[data-recolhido="true"\]/);
  assert.match(shell, /\[data-celular="nunca"\]/);
  assert.match(shell, /\[data-celular="so"\]/);
});

test("o shell só usa tokens: nenhum hex além do branco sobre o menu", () => {
  for (const [nome, css] of [["shell", shell], ["primitivos", primitivos]]) {
    const hex = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase());
    assert.deepEqual(hex.filter((h) => h !== "#ffffff"), [], `${nome}.css tem cor solta`);
  }
});

test("animação do popover usa token de duração e respeita reduzir movimento", () => {
  assert.match(shell, /prefers-reduced-motion:\s*no-preference[\s\S]*var\(--t-troca/);
});
