#!/usr/bin/env node
// Gera o tema e o manifest de um sistema IDF novo a partir de duas respostas: nome/sobre e cor.
// Uso:  node idf-app.mjs --nome "Lojinha IDF" --sobre "Estoque, vendas e caixa" --cor "#0b7a68" [--publico] [--saida ./pasta] [--simular]
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { relatorio, tokensDeMarca, validarHex } from "../../ui/src/tokens/cor.mjs";

function args(argv) {
  const a = { publico: false, simular: false, saida: "." };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--publico") a.publico = true;
    else if (k === "--simular") a.simular = true;
    else if (k.startsWith("--")) a[k.slice(2)] = argv[++i];
  }
  return a;
}

export function slug(nome) {
  return (
    nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "sistema"
  );
}

function bloco(seletor, t) {
  const linhas = Object.entries(t).map(([k, v]) => `  ${(k + ":").padEnd(14)} ${v};`);
  return `${seletor} {\n${linhas.join("\n")}\n}\n`;
}

export function gerarTema({ nome, cor }) {
  const s = slug(nome);
  const claro = tokensDeMarca(cor, "claro");
  const escuro = tokensDeMarca(cor, "escuro");
  const recuo = (texto) => texto.replace(/^(?=.)/gm, "  ");
  const cabecalho = `/* Tema do produto "${nome}" (camada 4). Gerado por idf-app: não edite as cores à mão. */`;
  return [
    cabecalho,
    bloco(`[data-produto="${s}"]`, claro),
    "@media (prefers-color-scheme: dark) {",
    recuo(bloco(`[data-produto="${s}"]:not([data-tema="claro"])`, escuro)) + "}",
    "",
    bloco(`[data-produto="${s}"][data-tema="escuro"]`, escuro),
  ].join("\n");
}

export function gerarManifest({ nome, sobre, cor, publico }) {
  return {
    name: nome,
    short_name: nome.slice(0, 12),
    description: sobre,
    start_url: "/?origem=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    theme_color: tokensDeMarca(cor, "claro")["--hero"],
    background_color: publico ? "#fbf7ee" : "#f4f5f9",
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

async function main() {
  const a = args(process.argv.slice(2));
  if (!a.nome || !a.cor) {
    console.error('Faltam respostas. Uso: --nome "Lojinha IDF" --sobre "Estoque e vendas" --cor "#0b7a68" [--publico]');
    process.exit(2);
  }
  if (!validarHex(a.cor)) {
    console.error(`Cor inválida: ${a.cor}. Use o formato #rrggbb.`);
    process.exit(2);
  }
  const dados = { nome: a.nome, sobre: a.sobre ?? "", cor: a.cor.toLowerCase(), publico: a.publico };

  console.log(`Sistema: ${dados.nome} (${slug(dados.nome)}) · registro ${dados.publico ? "expressivo" : "operacional"}\n`);
  for (const tema of ["claro", "escuro"]) {
    for (const r of relatorio(dados.cor, tema)) {
      console.log(`${r.ok ? "ok " : "ERRO"} [${tema}] ${r.regra}: ${r.razao.toFixed(1)}:1 (mín. ${r.minimo})`);
    }
  }
  if (a.simular) return;

  const pasta = resolve(a.saida);
  await mkdir(join(pasta, "src"), { recursive: true });
  await mkdir(join(pasta, "public"), { recursive: true });
  await writeFile(join(pasta, "src", "tema.css"), gerarTema(dados));
  await writeFile(join(pasta, "public", "manifest.webmanifest"), JSON.stringify(gerarManifest(dados), null, 2) + "\n");
  await writeFile(join(pasta, "idf.json"), JSON.stringify({ ...dados, slug: slug(dados.nome), registro: dados.publico ? "expressivo" : "operacional" }, null, 2) + "\n");
  console.log(`\nGerado em ${pasta}: src/tema.css, public/manifest.webmanifest, idf.json`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("idf-app.mjs")) {
  main();
}
