---
name: idf-adotar-arquitetura
description: Adapta um projeto de front que já existe à arquitetura e aos padrões da Igreja IDF, em fases e sem quebrar nada. Use quando o usuário pedir para adotar, migrar, adequar ou diagnosticar a arquitetura de front de um projeto existente (React, Vue, Svelte ou JS puro). Não serve para criar um projeto novo, que é a skill idf-novo-sistema.
---

# Adotar a arquitetura de front IDF em um projeto existente

A referência completa está em `references/arquitetura-front.md` (junto desta skill; no plugin, `${CLAUDE_PLUGIN_ROOT}/skills/idf-adotar-arquitetura/references/arquitetura-front.md`). Leia antes de começar. Os padrões visuais e de segurança estão em `${CLAUDE_PLUGIN_ROOT}/docs/padroes.md`, quando disponível.

Siga também o `CLAUDE.md` e os guias do projeto: eles valem mais que qualquer suposição sua.

## Regras gerais

- **Mantenha o framework do projeto.** Nunca troque de framework. O núcleo (`api`, erros, regras, formatos, dinheiro, fila, estado) é TypeScript puro, sem importar framework.
- **Passos pequenos.** Cada passo deixa lint, testes e build verdes. Nada de reescrever tudo nem de mover várias funcionalidades juntas.
- **Não faça commit, push nem abra PR** sem o usuário pedir.
- **Não invente estilo.** Cores só por token (`var(--brand)`, `--surface`...). Nenhum hex em tela.
- **Teste só o que protege uma regra** (dinheiro, datas, estoque, fila, limpeza de stack, dependências entre camadas).
- Responda em português.

## Fase 0 · Diagnóstico (somente leitura)

Não altere nenhum arquivo. Entregue um relatório curto com:

1. **Stack:** framework, bundler, roteador, estado, runner de testes, como o CSS é feito, se há PWA e Sentry.
2. **Estrutura atual** de pastas comparada com a arquitetura (camadas e pastas por funcionalidade).
3. **Onde está cada item**, com arquivo e linha:
   - cores literais (`#`, `rgb(`, `hsl(`) fora do arquivo de tema;
   - `dangerouslySetInnerHTML`, `v-html`, `{@html}`, `innerHTML =`, `eval(`;
   - token ou dado de venda em `localStorage`/`sessionStorage`;
   - `fetch`/`axios` fora do cliente único da API;
   - `catch` vazio ou que só faz `console.log`;
   - arquivos de tela com mais de 400 linhas;
   - regra de negócio dentro de componente (total, datas, estoque);
   - valores monetários como `float`;
   - service worker cacheando `/api` com dado pessoal.
4. **O que já está de acordo**, para não refazer.
5. **Plano em fases**, com tamanho e risco de cada uma, marcando o que depende de decisão do usuário.

**Pare aqui e espere a aprovação do plano.** Não comece a Fase 1 sem ela.

## Fase 1 · Fundação (sem tocar nas telas)

- Se o projeto ainda não tem tema, pergunte **só** o nome e sobre o que é o sistema, e a cor, e gere com `node "${CLAUDE_PLUGIN_ROOT}/packages/create-idf-app/bin/idf-app.mjs" --nome ... --sobre ... --cor ... --saida .`. Se já tem tokens, crie **aliases** para os nomes atuais em vez de renomear.
- Traga o design system para dentro do projeto, **como cópia** (o projeto não depende dele para compilar): `node "${CLAUDE_PLUGIN_ROOT}/packages/create-idf-app/bin/idf-sync.mjs" --destino src/idf`. Isso cria `src/idf/css/`, `src/idf/core/` e `src/idf/idf-lock.json`. Tire `src/idf/` do lint e do formatador.
- Garanta `data-produto` e `data-registro` no elemento raiz e o tema escuro funcionando.
- Confira o manifest e o `theme-color`.

## Fase 2 · Núcleo

O núcleo **já vem do design system**, na cópia `src/idf/core/` (Fase 1): cliente único da API (cabeçalho anti-CSRF, `credentials`, sem token, Problem Details convertido em `ErroApp`), `erros` (`limparStack` e o painel de erro), o menu recolhido, o tema e o estado observável (`ler`, `assinar`). **Use esses, não recrie.** Só crie no projeto, em TypeScript puro e com teste, o que o design system não traz:

- `formatos` e `dinheiro`: `R$ 1.234,50` e valores em centavos inteiros (soma, troco, rateio);
- a fila de envio e as regras de cada funcionalidade;
- a ponte fina para o framework do projeto (um hook, um composable), sem regra de negócio.

Troque os usos antigos **um arquivo por vez**.

## Fase 3 · Funcionalidades

Reorganize **uma funcionalidade por vez**, começando pela de menor risco:

```
funcionalidades/<nome>/ index.ts · api.ts · regras.ts (+ regras.test.ts) · telas/ · componentes/
```

Só o `index.ts` é importado por fora. Tire a regra de negócio dos componentes para `regras.ts`. Ao fim de cada funcionalidade, pare e mostre o resultado antes da próxima.

## Fase 4 · Shell, erros e PWA

- Shell igual ao do Pastinho: menu lateral recolhível no computador, barra inferior no celular, avatar e sino de avisos no canto superior direito. O CSS dele vem da cópia (`src/idf/css/shell.css`); o componente que o liga ao framework é do projeto.
- Painel de erro único (mensagem, código, status, requisição, detalhes técnicos, copiar detalhes), também no limite de erro da tela inteira. Sistema **interno** mostra a stack; sistema **público** não mostra e envia ao Sentry.
- PWA: instalação, "sem conexão" e "nova versão". O service worker não cacheia `/api` com dado pessoal ou financeiro e limpa tudo no logout.

## Fase 5 · Travas

- Teste de arquitetura conferindo as dependências entre camadas (`dependency-cruiser` ou equivalente).
- `stylelint` contra cor solta, lint contra HTML cru e `eval`, limite de 400 linhas por arquivo de tela.
- CI com lint, testes, build e `npm audit --omit=dev`.

## Fase 6 · Manter em dia

Quando o design system mudar, **sincronize** em vez de editar a cópia: rode `idf-sync.mjs --destino src/idf --verificar`, mostre o que está desatualizado ou editado à mão e só então sincronize. O passo a passo está na skill `idf-novo-sistema` (Modo 4).

## Ao terminar cada fase

Diga: o que mudou, quais arquivos, o resultado de `lint`, `test` e `build`, e o que ficou pendente. Se algo não puder ser feito, explique o motivo em vez de contornar.
