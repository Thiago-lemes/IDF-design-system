import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contraste } from "../src/tokens/cor.mjs";

const css = readFileSync(new URL("../src/tokens/series.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../src/tokens/tokens.css", import.meta.url), "utf8");

function valores(bloco) {
  return Object.fromEntries([...bloco.matchAll(/(--serie-\d)\s*:\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));
}
const claro = valores(css.split("@media")[0]);
const escuro = valores(css.split(':root[data-tema="escuro"]')[1]);
const media = valores(css.split("@media (prefers-color-scheme: dark)")[1].split(':root[data-tema="escuro"]')[0]);
const superficie = (re) => tokens.match(re)[1];
const SUP_CLARO = superficie(/:root \{[\s\S]*?--surface:\s*(#[0-9a-f]{6})/);
const SUP_ESCURO = superficie(/:root\[data-tema="escuro"\] \{[\s\S]*?--surface:\s*(#[0-9a-f]{6})/);

test("há seis séries nos dois temas", () => {
  assert.equal(Object.keys(claro).length, 6);
  assert.equal(Object.keys(escuro).length, 6);
});

test("o tema escuro por preferência do aparelho e o escolhido à mão têm os mesmos valores", () => {
  assert.deepEqual(media, escuro);
});

test("cada preenchimento tem pelo menos 3:1 sobre a superfície do tema", () => {
  for (const [n, hex] of Object.entries(claro)) assert.ok(contraste(hex, SUP_CLARO) >= 3, `${n} claro ${hex}`);
  for (const [n, hex] of Object.entries(escuro)) assert.ok(contraste(hex, SUP_ESCURO) >= 3, `${n} escuro ${hex}`);
});

test("nenhuma série repete cor dentro do tema", () => {
  assert.equal(new Set(Object.values(claro)).size, 6);
  assert.equal(new Set(Object.values(escuro)).size, 6);
});

test("o tom original (tinta suave) existe para as seis", () => {
  assert.equal([...css.matchAll(/--serie-\d-tom:/g)].length, 6);
});
