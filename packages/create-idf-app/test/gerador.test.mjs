import { test } from "node:test";
import assert from "node:assert/strict";
import { gerarManifest, gerarTema, slug } from "../bin/idf-app.mjs";

test("o tema gerado é CSS válido: toda declaração tem nome, dois-pontos e valor", () => {
  const css = gerarTema({ nome: "Lojinha IDF", cor: "#0b7a68" });
  const declaracoes = css.split("\n").filter((l) => l.trim().startsWith("--"));
  assert.ok(declaracoes.length >= 18, "tokens dos dois temas presentes");
  for (const d of declaracoes) assert.match(d.trim(), /^--[a-z-]+:\s+#[0-9a-f]{6};$/, d);
  assert.equal((css.match(/\{/g) ?? []).length, (css.match(/\}/g) ?? []).length, "chaves balanceadas");
});

test("o tema escuro vale tanto por preferência do sistema quanto por escolha explícita", () => {
  const css = gerarTema({ nome: "Lojinha IDF", cor: "#0b7a68" });
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /\[data-tema="escuro"\]/);
});

test("slug tira acentos e símbolos", () => {
  assert.equal(slug("Lojinha IDF"), "lojinha-idf");
  assert.equal(slug("Café & Pão!"), "cafe-pao");
  assert.equal(slug("***"), "sistema");
});

test("o manifest é instalável: standalone, ícones 192, 512 e maskable", () => {
  const m = gerarManifest({ nome: "Lojinha IDF", sobre: "x", cor: "#0b7a68", publico: false });
  assert.equal(m.display, "standalone");
  assert.deepEqual(m.icons.map((i) => i.sizes), ["192x192", "512x512", "512x512"]);
  assert.ok(m.icons.some((i) => i.purpose === "maskable"));
  assert.ok(m.short_name.length <= 12);
});
