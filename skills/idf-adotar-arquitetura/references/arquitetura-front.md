# Arquitetura do front IDF

Vale para qualquer sistema da IDF, seja em React, Vue, Svelte ou JavaScript puro. A ideia central: **o que importa não depende do framework**. O framework só desenha as telas.

## Princípios

1. **Núcleo sem framework.** Cliente da API, erros, regras, formatos, fila offline e estado de PWA são TypeScript puro. Testam-se sem DOM.
2. **O visual é um contrato em CSS**, não em componentes de um framework. Classes `idf-*` e atributos `data-*` funcionam em qualquer stack.
3. **Adaptador fino por framework.** Um componente React, Vue ou Svelte só liga o contrato CSS e o núcleo. Sem regra de negócio dentro dele.
4. **Uma pasta por funcionalidade**, espelhando os módulos do back-end.
5. **Dependência em um sentido só**, conferida por teste (como o `test_arquitetura.py` do Pastinho).
6. **Regra que protege dinheiro ou dado de pessoa tem teste.** O resto, só se proteger uma regra.

## Camadas

```
app/                        bootstrap, rotas, shell          (específico do framework)
funcionalidades/<nome>/     telas e componentes da feature    (framework)
                            regras.ts, api.ts                 (puro)
compartilhado/              componentes do projeto reutilizáveis (framework)
@idf/ui                     tokens + CSS + adaptadores        (CSS puro + adaptador por framework)
@idf/core                   núcleo                            (TypeScript puro)
```

| Quem | Pode importar | Não pode importar |
|---|---|---|
| `@idf/core` | nada do projeto, nada de framework, nada de DOM obrigatório | `@idf/ui`, qualquer framework |
| `funcionalidades/x/regras.ts`, `api.ts` | `@idf/core`, tipos | framework, outras funcionalidades |
| `funcionalidades/x/telas` | suas regras e api, `@idf/ui`, `compartilhado/` | **dentro** de outra funcionalidade (só o `index.ts` dela) |
| `compartilhado/` | `@idf/ui`, `@idf/core` | funcionalidades |
| `app/` | tudo acima | |

Nenhum arquivo importa nome interno (começado por `_`) de outro módulo. Ciclos são proibidos.

**Como `@idf/ui` e `@idf/core` chegam ao projeto.** Não são pacotes para instalar: são pastas do design system. O projeto recebe uma **cópia** em `src/idf/` (`css/` e `core/`), feita e mantida pelo `idf-sync.mjs`, e importa dela por caminho relativo. A cópia é só leitura: muda-se no design system e sincroniza-se. Onde esta tabela diz `@idf/ui` e `@idf/core`, leia `src/idf/css` e `src/idf/core`.

## Pastas de um projeto

```
src/
  app/            main, rotas, shell, provedores (sessão, avisos, tema)
  nucleo/         só se o projeto ainda não usa @idf/core (migre aos poucos)
  funcionalidades/
    venda/
      index.ts            a única porta pública da funcionalidade
      api.ts              chamadas (usa o cliente do core)
      regras.ts           cálculo, validação, formatação (puro, com teste)
      regras.test.ts
      telas/              Venda.tsx / Venda.vue / venda.ts
      componentes/        pedaços só desta funcionalidade
    estoque/ caixa/ ...
  compartilhado/  componentes do projeto usados por mais de uma funcionalidade
  tema.css        gerado por idf-app
  tipos-api.ts    gerado do OpenAPI (openapi-typescript)
```

Arquivo de tela passa de uns 400 linhas? Divida em painel, formulários e hook. Nomes em português, como no Pastinho.

## O núcleo (`@idf/core`)

| Módulo | Faz |
|---|---|
| `api` | `api(rota, opções)`: envia o cabeçalho anti-CSRF, `credentials`, converte Problem Details em `ErroApp`, nunca guarda token |
| `erros` | `ErroApp` (título, mensagem, código, status, requisição, stack), `limparStack()`, `montarDetalhes()` |
| `formatos` | moeda `R$ 1.234,50`, datas e fuso de Brasília, telefone |
| `dinheiro` | valores em centavos (inteiros), soma, troco, rateio. Nunca `float` |
| `sessao` | interface da sessão (quem sou, papéis), sem armazenar token |
| `fila` | fila offline com prazo de validade, idempotência e limpeza no logout |
| `pwa` | instalação, conexão e nova versão, como estados observáveis |
| `armazenamento` | estado observável (`assinar`, `ler`) para tema, menu recolhido e afins |

### Estado observável (o padrão que o Pastinho já usa)

```ts
// núcleo: sem framework
export function criarEstado<T>(inicial: T) {
  let valor = inicial;
  const ouvintes = new Set<() => void>();
  return {
    ler: () => valor,
    definir(novo: T) { valor = novo; ouvintes.forEach((f) => f()); },
    assinar(f: () => void) { ouvintes.add(f); return () => ouvintes.delete(f); },
  };
}
// React:  const v = useSyncExternalStore(e.assinar, e.ler)
// Vue:    shallowRef + onMounted(e.assinar)      Svelte: readable(e.ler(), set => e.assinar(...))
// Puro:   e.assinar(() => render(e.ler()))
```

O `menuLateral.ts` do Pastinho é exatamente isso. A regra: o estado vive no núcleo e o hook é só uma ponte.

## O visual (`@idf/ui`)

- **Camada 1, tokens:** `tokens.css`, `motion.css` (animações padrão), `marca.css` (a marca da igreja em carregamento) e `tema.css` (gerado). Sem JavaScript; o movimento é por atributo (`data-anim`), não por código.
- **Camada 2, componentes por classe:** `idf-btn`, `idf-campo`, `idf-selo`, `idf-alerta`, `idf-tabela`, `idf-cartao`, `idf-kpi`. Funcionam com HTML puro.
- **Camada 3, comportamento sem framework:** diálogo, popover, menu da conta, abas, toast e o shell (menu recolhível, sino de avisos) são controladores em `@idf/core` que cuidam de foco, `Esc`, `aria-*` e teclado.
- **Camada 4, adaptadores:** `@idf/react` primeiro (o Pastinho é React). Cada novo framework ganha o seu adaptador fino. Os controladores e o CSS são reaproveitados.

Quando usar Web Components: se mais de dois sistemas forem de stacks diferentes, os componentes interativos (shell, diálogo, painel de erro) viram `<idf-shell>`, `<idf-dialogo>`, `<idf-erro>` e todos os frameworks os usam sem adaptador. Até lá, adaptador por framework é mais simples e mais fácil de testar.

## O que muda por framework

| | React | Vue | Svelte | JS puro |
|---|---|---|---|---|
| `@idf/core`, `regras.ts`, `api.ts`, tokens, CSS | igual | igual | igual | igual |
| Telas e componentes | `.tsx` | `.vue` | `.svelte` | funções que escrevem no DOM |
| Ponte com o estado | `useSyncExternalStore` | `shallowRef` | `readable` | `assinar` |
| Rotas e provedores (`app/`) | React Router | Vue Router | SvelteKit/router | roteador mínimo |
| Build, PWA, lint, testes | Vite + vite-plugin-pwa, ESLint, Vitest | igual | igual | igual |

## Testes

| Camada | Teste | Quando |
|---|---|---|
| `@idf/core`, `regras.ts` | unitário (Vitest, sem DOM) | sempre que protege uma regra: dinheiro, datas, estoque, fila, limpeza de stack |
| cliente da API | contra respostas simuladas de Problem Details | sempre |
| componente | jsdom, só para fluxo com regra (ex.: carrinho, painel de erro) | quando protege algo |
| fluxo crítico | Playwright: venda completa, offline com fila, instalação | 1 a 3 fluxos por sistema |
| arquitetura | `arquitetura.test.ts` confere as dependências da tabela acima | sempre |

## Travas automáticas

- **Dependências entre camadas:** `dependency-cruiser` (ou `eslint-plugin-boundaries`) com as regras da tabela.
- **Cor solta:** `stylelint` com `color-no-hex` fora de `tema.css`, e regra de lint contra cor literal em estilo inline.
- **Segurança:** lint contra `dangerouslySetInnerHTML`, `v-html`, `{@html}`, `innerHTML =`, `eval` e `localStorage` com token.
- **Tamanho:** arquivo de tela acima de 400 linhas falha o lint.
- **CI:** lint, testes, build, `npm audit --omit=dev`.

## Ordem de adoção em um projeto que já existe

1. Diagnóstico (só leitura): o que já cumpre, o que não.
2. Fundação: tokens e tema, sem tocar nas telas.
3. Núcleo: mover cliente da API, erros, formatos e dinheiro para módulos puros.
4. Funcionalidades: reorganizar **uma por vez**, mantendo tudo verde.
5. Shell, painel de erro e PWA.
6. Travas no CI.

Nunca reescrever tudo de uma vez. Cada passo deixa `lint`, `test` e `build` verdes.
