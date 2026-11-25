#!/usr/bin/env node
// Sincroniza um projeto com o design system: copia para uma pasta do projeto (por padrão `src/idf`) os
// arquivos que ele usa e confere se a cópia está em dia. O projeto NÃO depende do design system para
// compilar; só precisa dele ao rodar este comando.
//
// Uso:
//   node idf-sync.mjs --destino ./src/idf              copia (ou atualiza) e grava idf-lock.json
//   node idf-sync.mjs --destino ./src/idf --verificar  só confere; sai com código 1 se algo divergir
//   --forcar   sobrescreve arquivo que foi editado à mão no projeto
//   --origem   pasta do design system (padrão: o repositório onde este script está)
//
// Regra: os arquivos copiados são só leitura. Para mudar o menu, o tema ou as cores, mude no design
// system e sincronize de novo. O `idf-lock.json` guarda a impressão digital de cada arquivo, e é ele que
// permite ao projeto perceber uma edição à mão mesmo sem ter o design system por perto.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ_PADRAO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PREFIXO_CABECALHO = "/* Copiado do idf-design-system";
const NOME_DO_LOCK = "idf-lock.json";

// CSS do @idf/ui que o projeto usa, na ordem em que deve ser importado.
const CSS = [
  ["tokens", "tokens/tokens.css"],
  ["motion", "tokens/motion.css"],
  ["marca", "tokens/marca.css"],
  ["series", "tokens/series.css"],
  ["shell", "shell/shell.css"],
  ["primitivos", "shell/primitivos.css"],
];

/** Os arquivos que o design system entrega: o CSS de `@idf/ui` e todo o TypeScript de `@idf/core`. */
export function manifesto(origem) {
  const itens = CSS.map(([nome, rel]) => ({ destino: `css/${nome}.css`, origem: `packages/ui/src/${rel}` }));
  // O `marca.css` faz `@import "../brand/marca-mascaras.css"` (as máscaras da marca, embutidas): fica ao lado de `css/`.
  itens.push({ destino: "brand/marca-mascaras.css", origem: "packages/ui/src/brand/marca-mascaras.css" });
  const core = join(origem, "packages/core/src");
  for (const f of readdirSync(core).filter((n) => n.endsWith(".ts")).sort()) {
    itens.push({ destino: `core/${f}`, origem: `packages/core/src/${f}` });
  }
  return itens;
}

const normalizar = (texto) => texto.replace(/\r\n/g, "\n");
const impressao = (texto) => createHash("sha256").update(normalizar(texto)).digest("hex");

function semCabecalho(texto) {
  const t = normalizar(texto);
  return t.startsWith(PREFIXO_CABECALHO) ? t.slice(t.indexOf("\n") + 1) : t;
}

const impressaoDoArquivo = (caminho) => impressao(semCabecalho(readFileSync(caminho, "utf8")));
const impressaoDaOrigem = (origem, item) => impressao(readFileSync(join(origem, item.origem), "utf8"));

function lerLock(destino) {
  const caminho = join(destino, NOME_DO_LOCK);
  return existsSync(caminho) ? JSON.parse(readFileSync(caminho, "utf8")) : null;
}

function git(origem, ...args) {
  try {
    return execFileSync("git", ["-C", origem, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function versaoDaOrigem(origem) {
  const base = git(origem, "rev-parse", "--short", "HEAD");
  if (!base) return "desconhecida";
  return git(origem, "status", "--porcelain", "--", "packages") ? `${base}+alteracoes` : base;
}

/** Copia (ou atualiza) os arquivos e grava o lock. Recusa sobrescrever o que foi editado à mão, salvo `forcar`. */
export function sincronizar({ origem = RAIZ_PADRAO, destino, forcar = false }) {
  const itens = manifesto(origem);
  const lock = lerLock(destino);
  const anteriores = lock?.arquivos ?? {};
  const editados = [];
  for (const item of itens) {
    const alvo = join(destino, item.destino);
    if (!existsSync(alvo)) continue;
    const atual = impressaoDoArquivo(alvo);
    const novo = impressaoDaOrigem(origem, item);
    // Mudou no projeto: o conteúdo atual não é o do design system nem o da última sincronização.
    if (atual !== novo && atual !== anteriores[item.destino]) editados.push(item.destino);
  }
  if (editados.length && !forcar) return { copiados: [], removidos: [], editados };

  const arquivos = {};
  const copiados = [];
  for (const item of itens) {
    const texto = normalizar(readFileSync(join(origem, item.origem), "utf8"));
    const alvo = join(destino, item.destino);
    const conteudo = `${PREFIXO_CABECALHO} (${item.origem}). Não edite aqui: mude no design system e sincronize de novo. */\n${texto.endsWith("\n") ? texto : `${texto}\n`}`;
    mkdirSync(dirname(alvo), { recursive: true });
    if (!existsSync(alvo) || normalizar(readFileSync(alvo, "utf8")) !== conteudo) copiados.push(item.destino);
    writeFileSync(alvo, conteudo, "utf8");
    arquivos[item.destino] = impressao(texto);
  }
  const removidos = Object.keys(anteriores).filter((a) => !(a in arquivos));
  for (const r of removidos) rmSync(join(destino, r), { force: true });

  const versao = JSON.parse(readFileSync(join(origem, "packages/ui/package.json"), "utf8")).version;
  const novoLock = { origem: "idf-design-system", versao, commit: versaoDaOrigem(origem), arquivos };
  writeFileSync(join(destino, NOME_DO_LOCK), `${JSON.stringify(novoLock, null, 2)}\n`, "utf8");
  return { copiados, removidos, editados: [] };
}

/** Confere a cópia contra o lock e contra o design system. Devolve a lista de problemas (vazia = em dia). */
export function verificar({ origem = RAIZ_PADRAO, destino }) {
  const lock = lerLock(destino);
  if (!lock) return [`sem ${NOME_DO_LOCK} em ${destino}: rode a sincronização`];
  const problemas = [];
  const itens = manifesto(origem);
  for (const item of itens) {
    const alvo = join(destino, item.destino);
    if (!existsSync(alvo)) {
      problemas.push(`faltando: ${item.destino}`);
      continue;
    }
    if (impressaoDoArquivo(alvo) !== lock.arquivos[item.destino]) problemas.push(`editado no projeto: ${item.destino}`);
    if (impressaoDaOrigem(origem, item) !== lock.arquivos[item.destino]) {
      problemas.push(`desatualizado: ${item.destino} (o design system mudou)`);
    }
  }
  for (const antigo of Object.keys(lock.arquivos)) {
    if (!itens.some((i) => i.destino === antigo)) problemas.push(`removido do design system: ${antigo}`);
  }
  return problemas;
}

function argumentos(argv) {
  const a = { verificar: false, forcar: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--verificar") a.verificar = true;
    else if (k === "--forcar") a.forcar = true;
    else if (k.startsWith("--")) a[k.slice(2)] = argv[++i];
  }
  return a;
}

function principal() {
  const a = argumentos(process.argv.slice(2));
  if (!a.destino) {
    console.error("Informe a pasta de destino: --destino ./src/idf");
    process.exit(2);
  }
  const origem = resolve(a.origem ?? RAIZ_PADRAO);
  const destino = resolve(a.destino);
  if (a.verificar) {
    const problemas = verificar({ origem, destino });
    if (problemas.length === 0) {
      console.log("A cópia do design system está em dia.");
      return;
    }
    for (const p of problemas) console.log(`  ${p}`);
    console.log("\nPara atualizar: rode a sincronização (sem --verificar). Arquivo editado à mão exige --forcar.");
    process.exit(1);
  }
  const r = sincronizar({ origem, destino, forcar: a.forcar });
  if (r.editados.length) {
    console.log("Não sobrescrevi: estes arquivos foram editados no projeto (use --forcar para sobrescrever):");
    for (const e of r.editados) console.log(`  ${e}`);
    process.exit(1);
  }
  console.log(`Sincronizado de ${versaoDaOrigem(origem)}: ${r.copiados.length} arquivo(s) novo(s) ou atualizado(s), ${r.removidos.length} removido(s).`);
  for (const c of r.copiados) console.log(`  ${c}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) principal();
