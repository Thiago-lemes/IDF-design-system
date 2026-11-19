import { test } from "node:test";
import assert from "node:assert/strict";
import { contraste, relatorio, tokensDeMarca, validarHex } from "../src/tokens/cor.mjs";

const CORES = ["#0b7a68", "#2b2d8f", "#7a1f3d", "#c2570c", "#1d5fc4", "#5a3fb8", "#ffc83d", "#e8f5e9", "#111111"];

test("qualquer cor passa nas regras de contraste nos dois temas", () => {
  for (const cor of CORES) {
    for (const tema of ["claro", "escuro"]) {
      for (const r of relatorio(cor, tema)) {
        assert.ok(r.ok, `${cor} (${tema}): "${r.regra}" deu ${r.razao.toFixed(2)}, mínimo ${r.minimo}`);
      }
    }
  }
});

test("uma cor que já passa não é alterada no preenchimento do tema claro", () => {
  assert.equal(tokensDeMarca("#2b2d8f", "claro")["--brand"], "#2b2d8f");
});

test("amarelo ganha texto escuro no botão em vez de ser escurecido", () => {
  const t = tokensDeMarca("#ffc83d", "claro");
  assert.equal(t["--brand"], "#ffc83d");
  assert.equal(t["--brand-on"], "#14162e");
});

test("cor inválida é recusada com mensagem clara", () => {
  assert.equal(validarHex("azul"), false);
  assert.throws(() => tokensDeMarca("azul"), /Cor inválida/);
});

test("contraste de preto com branco é 21:1", () => {
  assert.ok(Math.abs(contraste("#000000", "#ffffff") - 21) < 0.01);
});
