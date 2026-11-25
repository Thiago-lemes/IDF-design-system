import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { manifesto, sincronizar, verificar } from "../bin/idf-sync.mjs";

const RAIZ = fileURLToPath(new URL("../../..", import.meta.url));

/** Um design system de brinquedo: só o que o sincronizador lê, copiado do verdadeiro. */
function criarOrigem(base) {
  const origem = join(base, "origem");
  cpSync(join(RAIZ, "packages/ui/src"), join(origem, "packages/ui/src"), { recursive: true });
  cpSync(join(RAIZ, "packages/core/src"), join(origem, "packages/core/src"), { recursive: true });
  mkdirSync(join(origem, "packages/ui"), { recursive: true });
  writeFileSync(join(origem, "packages/ui/package.json"), JSON.stringify({ version: "9.9.9" }));
  return origem;
}

describe("idf-sync", () => {
  let base, origem, destino;
  before(() => {
    base = mkdtempSync(join(tmpdir(), "idf-sync-"));
  });
  after(() => rmSync(base, { recursive: true, force: true }));
  const novo = () => {
    origem = criarOrigem(mkdtempSync(join(base, "caso-")));
    destino = join(base, `destino-${Math.random().toString(36).slice(2)}`);
  };

  it("o manifesto traz o CSS na ordem de importação e todo o core", () => {
    const m = manifesto(RAIZ).map((i) => i.destino);
    assert.deepEqual(m.slice(0, 6), ["css/tokens.css", "css/motion.css", "css/marca.css", "css/series.css", "css/shell.css", "css/primitivos.css"]);
    assert.ok(m.includes("brand/marca-mascaras.css"), "o marca.css importa ../brand/marca-mascaras.css");
    assert.ok(m.includes("core/index.ts") && m.includes("core/api.ts"));
    assert.ok(m.every((d) => !d.endsWith(".test.ts")), "testes do core não vão para o projeto");
  });

  it("copia tudo, com cabeçalho, e grava o lock com a versão", () => {
    novo();
    const r = sincronizar({ origem, destino });
    assert.ok(r.copiados.length >= 12);
    const css = readFileSync(join(destino, "css/tokens.css"), "utf8");
    assert.match(css, /^\/\* Copiado do idf-design-system \(packages\/ui\/src\/tokens\/tokens\.css\)/);
    const lock = JSON.parse(readFileSync(join(destino, "idf-lock.json"), "utf8"));
    assert.equal(lock.versao, "9.9.9");
    assert.equal(Object.keys(lock.arquivos).length, r.copiados.length);
    assert.deepEqual(verificar({ origem, destino }), []);
  });

  it("sincronizar de novo sem mudança não copia nada", () => {
    novo();
    sincronizar({ origem, destino });
    assert.deepEqual(sincronizar({ origem, destino }).copiados, []);
  });

  it("percebe arquivo editado à mão e recusa sobrescrever sem --forcar", () => {
    novo();
    sincronizar({ origem, destino });
    const alvo = join(destino, "css/shell.css");
    writeFileSync(alvo, readFileSync(alvo, "utf8") + "\n.meu-ajuste { color: red; }\n");
    assert.deepEqual(verificar({ origem, destino }), ["editado no projeto: css/shell.css"]);
    const bloqueado = sincronizar({ origem, destino });
    assert.deepEqual(bloqueado.editados, ["css/shell.css"]);
    assert.deepEqual(bloqueado.copiados, []);
    assert.match(readFileSync(alvo, "utf8"), /meu-ajuste/, "não pode ter sobrescrito");
    sincronizar({ origem, destino, forcar: true });
    assert.deepEqual(verificar({ origem, destino }), []);
    assert.doesNotMatch(readFileSync(alvo, "utf8"), /meu-ajuste/);
  });

  it("percebe que o design system mudou e atualiza só o que mudou", () => {
    novo();
    sincronizar({ origem, destino });
    const fonte = join(origem, "packages/ui/src/tokens/series.css");
    writeFileSync(fonte, readFileSync(fonte, "utf8") + "\n/* novidade */\n");
    assert.deepEqual(verificar({ origem, destino }), ["desatualizado: css/series.css (o design system mudou)"]);
    const r = sincronizar({ origem, destino });
    assert.deepEqual(r.copiados, ["css/series.css"]);
    assert.deepEqual(verificar({ origem, destino }), []);
  });

  it("aponta arquivo que sumiu da cópia e o que saiu do design system", () => {
    novo();
    sincronizar({ origem, destino });
    rmSync(join(destino, "core/tema.ts"));
    assert.deepEqual(verificar({ origem, destino }), ["faltando: core/tema.ts"]);
    sincronizar({ origem, destino });
    rmSync(join(origem, "packages/core/src/estado.ts"));
    assert.deepEqual(verificar({ origem, destino }), ["removido do design system: core/estado.ts"]);
    const r = sincronizar({ origem, destino });
    assert.deepEqual(r.removidos, ["core/estado.ts"]);
    assert.equal(existsSync(join(destino, "core/estado.ts")), false);
  });

  it("sem lock, manda sincronizar", () => {
    novo();
    assert.match(verificar({ origem, destino })[0], /sem idf-lock\.json/);
  });

  it("ignora quebra de linha do Windows ao comparar", () => {
    novo();
    sincronizar({ origem, destino });
    const alvo = join(destino, "css/tokens.css");
    writeFileSync(alvo, readFileSync(alvo, "utf8").replace(/\n/g, "\r\n"));
    assert.deepEqual(verificar({ origem, destino }), []);
  });
});
