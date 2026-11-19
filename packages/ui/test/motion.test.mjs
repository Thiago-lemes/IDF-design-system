import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dir = new URL("../src/tokens/", import.meta.url);
const motion = readFileSync(new URL("motion.css", dir), "utf8");
const tokens = readFileSync(new URL("tokens.css", dir), "utf8");

test("toda animação referenciada tem @keyframes", () => {
  const definidos = new Set([...motion.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  const usados = [...motion.matchAll(/animation:\s*(idf-[\w-]+)/g)].map((m) => m[1]);
  assert.ok(usados.length > 0);
  for (const nome of usados) assert.ok(definidos.has(nome), `@keyframes ${nome} não existe`);
});

test("durações e curvas vêm dos tokens", () => {
  for (const t of ["--t-toque", "--t-troca", "--t-entra", "--ease-entra", "--ease-sai", "--ease-troca"]) {
    assert.match(tokens, new RegExp(`${t}:`), `${t} falta em tokens.css`);
  }
  for (const l of motion.split("\n").filter((x) => /^\[data-anim(?!-lista)/.test(x))) {
    assert.match(l, /var\(--t-/, `sem token de duração: ${l.trim()}`);
  }
});

test("reduzir movimento zera as durações e para os laços", () => {
  assert.match(tokens, /prefers-reduced-motion[\s\S]*--t-entra:\s*0ms/);
  assert.match(motion, /prefers-reduced-motion[\s\S]*\.idf-skel\s*\{\s*animation:\s*none/);
});

test("marca: seis traços com máscara e @keyframes, e reduzir movimento tratado", () => {
  const marca = readFileSync(new URL("marca.css", dir), "utf8");
  const mascaras = readFileSync(new URL("../brand/marca-mascaras.css", dir), "utf8");
  for (let i = 1; i <= 6; i++) {
    assert.ok(marca.includes(`nth-child(${i}) { --m: var(--marca-${i});`), `traço ${i} sem máscara`);
    assert.ok(mascaras.includes(`--marca-${i}: url("data:image/png;base64,`), `máscara ${i} ausente`);
  }
  const definidos = new Set([...marca.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  for (const m of marca.matchAll(/animation:\s*(idf-[\w-]+)/g)) {
    assert.ok(definidos.has(m[1]) || /idf-fade-in/.test(m[1]), `@keyframes ${m[1]} não existe`);
  }
  assert.match(marca, /prefers-reduced-motion[\s\S]*animation:\s*none/);
});
