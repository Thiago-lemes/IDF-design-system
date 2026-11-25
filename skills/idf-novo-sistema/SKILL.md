---
name: idf-novo-sistema
description: Cria um sistema novo da Igreja IDF no padrão do design system, escreve e revisa telas de um sistema IDF, ou sincroniza a cópia do design system que o projeto carrega. Use quando o usuário pedir para criar um sistema, app, módulo ou tela da IDF (lojinha, PDV, admin, qualquer outro), para revisar se um projeto segue o padrão visual, de segurança e de erros, ou para atualizar o design system num projeto.
---

# Sistema IDF no padrão

Todo sistema da IDF compartilha o mesmo visual, o mesmo menu e as mesmas regras de segurança e de erro. O desenvolvedor **não escolhe** fonte, raio, espaço, estados nem layout. Só informa duas coisas.

Referência completa dos padrões: `${CLAUDE_PLUGIN_ROOT}/docs/padroes.md`. Leia antes de escrever telas.

## Modo 1 · Criar um sistema novo

Faça **somente estas duas perguntas** (use a ferramenta de perguntas, se houver), e nada além delas:

1. **Nome e sobre o que é o sistema.** Ex.: "Lojinha IDF: estoque, vendas e caixa".
2. **Qual a cor?** Um código `#rrggbb`, ou um nome que você converte e confirma.

Deduza o público pela descrição: sistema para a equipe (estoque, caixa, admin) é **operacional**; sistema para famílias ou visitantes é **expressivo** (passe `--publico`). Só pergunte se for realmente ambíguo.

Depois rode o gerador na pasta do projeto:

```bash
node "${CLAUDE_PLUGIN_ROOT}/packages/create-idf-app/bin/idf-app.mjs" \
  --nome "Lojinha IDF" --sobre "Estoque, vendas e caixa" --cor "#0b7a68" --saida .
```

Ele imprime o relatório de contraste dos dois temas e grava `src/tema.css`, `public/manifest.webmanifest` e `idf.json`. Se algum item sair como `ERRO`, mostre ao usuário e não prossiga sem resolver. Se a cor for inválida, o gerador recusa com mensagem clara.

Depois **traga o design system para dentro do projeto**. O projeto não depende dele para compilar: fica com uma **cópia** dos arquivos que usa, em `src/idf/`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/packages/create-idf-app/bin/idf-sync.mjs" --destino src/idf
```

Isso copia o CSS (`src/idf/css/`: tokens, animações, marca, cores de categoria, shell e primitivos) e o núcleo em TypeScript (`src/idf/core/`: cliente da API, painel de erro, menu recolhido, tema), com um cabeçalho em cada arquivo, e grava `src/idf/idf-lock.json` com a impressão digital de cada um.

Em seguida, no app:

- acrescente ao `package.json` os atalhos `idf:sincronizar` e `idf:verificar`, que chamam o `idf-sync.mjs` do design system (ajuste o caminho para onde ele está na máquina; sem `--verificar` copia, com ele só confere);
- importe o CSS de `src/idf/css/` uma vez, na raiz, **nesta ordem**: `tokens.css`, `motion.css`, `marca.css`, `series.css`, `shell.css`, `primitivos.css` e por último `src/tema.css`;
- importe o TypeScript de `src/idf/core/` por caminho relativo. Não existe pacote `@idf/*` para instalar: os nomes `@idf/ui` e `@idf/core` são só pastas do design system;
- ponha `data-produto="<slug de idf.json>"` e, se for expressivo, `data-registro="expressivo"` no elemento raiz;
- use o CSS do shell e dos primitivos e o painel de erro que vêm na cópia. O adaptador do framework (o componente que liga o CSS ao núcleo) é do projeto: fino, sem regra de negócio. Se algo ainda não existir no design system, siga `docs/padroes.md` e **não invente um estilo próprio**: avise o usuário de que falta no design system;
- tire `src/idf/` do lint e do formatador (não é código do projeto) e acrescente um teste que compare os arquivos com o `idf-lock.json`, para ninguém editar a cópia à mão (o hub da secretaria tem um exemplo em `web/src/idf.test.ts`).

## Estrutura do projeto

Todo projeto novo segue a arquitetura em `${CLAUDE_PLUGIN_ROOT}/skills/idf-adotar-arquitetura/references/arquitetura-front.md`: núcleo sem framework, uma pasta por funcionalidade (`index.ts`, `api.ts`, `regras.ts` com teste, `telas/`), dependência em um sentido só e travas de lint. Qualquer framework serve; o núcleo e o CSS não mudam. Para **adaptar um projeto que já existe**, use a skill `idf-adotar-arquitetura`.

## Modo 2 · Escrever uma tela

Siga sempre, sem perguntar:

1. **Menu lateral e topo iguais aos do Pastinho.** Menu fixo à esquerda no computador (recolhível), barra inferior no celular. Avatar e avisos no canto superior direito. Nunca crie outro layout de navegação.
2. **Cores só por papel.** Use `var(--brand)`, `--surface`, `--text`, `--ok`, `--danger` e afins. **Nenhum hex, rgb ou nome de cor** numa tela. Texto de marca usa `--brand-text`; contorno e ícone, `--brand-line`.
3. **Tela de venda (PDV, lojinha).** Abre direto na venda. Busca e leitor de código de barras em foco, "Mais vendidos hoje", combos, categorias em um toque, selo de estoque baixo. Pagamento no próprio carrinho, `F2` cobra e `Esc` volta.
4. **Dinheiro.** `R$ 1.234,50`, fonte tabular, alinhado à direita. Total, preço e estoque são sempre recalculados no servidor. Cada venda envia uma chave de idempotência. Sem conexão, entra na fila como "Pendente de envio" e só vira "Pago" depois da confirmação.
5. **Erros.** Todo erro usa o painel único: título e explicação em português dizendo o efeito, código, status, número da requisição e detalhes técnicos. Em sistema **interno** a stack aparece sempre; em sistema **público** ela fica fora da tela e vai para o Sentry. A stack passa pela limpeza (sem e-mail, token, query nem caminho do computador). Nunca engula um erro em silêncio.
6. **Segurança do front.** Sem token em `localStorage`; sessão por cookie `HttpOnly`. Sem `dangerouslySetInnerHTML`, `eval` nem `innerHTML` com dado do usuário. Links externos com `rel="noopener noreferrer"`. O service worker não cacheia `/api` com dado pessoal ou financeiro e limpa tudo no logout. Ação sensível (estorno, sangria, exclusão) pede senha de novo e registra auditoria.
7. **Movimento e carregamento.** Só as animações do `motion.css` (`data-anim`, `.idf-toque`), sem `transition` ou `@keyframes` próprios e sem passar de 300 ms; anime só `transform` e `opacity`. Carregando: lista ou tabela usa esqueleto (`.idf-skel`); ação curta, spinner (`.idf-spin`); tela ou painel que demora, a marca `data-marca="tracos"`; abertura do app, `data-marca="monta"` com `.idf-abertura`. **PDV nunca usa a marca nem cascata.** Detalhes em `docs/padroes.md` ("Animações padrão" e "Marca em carregamento").
8. **PWA.** Toda tela funciona instalada: alvos de toque de 44 px (o token `--ctl` já cuida), nada que dependa de hover, safe areas respeitadas, estados "sem conexão" e "nova versão" tratados.
8. **Acessibilidade.** Rótulo visível em todo campo, foco visível, `aria-live` em avisos, erro com ícone e texto (nunca só cor), movimento reduzido respeitado.

## Modo 3 · Revisar um projeto

Percorra os itens acima no código e responda com uma lista curta: o que está fora do padrão, em qual arquivo e linha, e a correção. Procure especificamente:

- cores literais (`#`, `rgb(`, `hsl(`) fora de `tema.css`;
- `dangerouslySetInnerHTML`, `eval(`, `innerHTML =`, `localStorage` guardando token ou dado de venda;
- `catch` vazio ou que só faz `console.log`;
- chamadas de dinheiro que confiam no total vindo do front;
- uso de `/api` com dado pessoal em cache do service worker;
- navegação própria no lugar do shell;
- cópia do design system fora de dia ou editada à mão (rode o `idf-sync.mjs --verificar`).

Não corrija sem o usuário pedir. Relate primeiro.

## Modo 4 · Sincronizar com o design system

Use quando o design system mudou, ou quando o usuário pedir para atualizar o design system no projeto.

1. Confira: `node "${CLAUDE_PLUGIN_ROOT}/packages/create-idf-app/bin/idf-sync.mjs" --destino src/idf --verificar`. Ele lista o que está **desatualizado** (o design system mudou), **editado no projeto** (alguém mexeu à mão) ou **faltando**.
2. Mostre a lista ao usuário e explique cada item. Se houver arquivo **editado no projeto**, pergunte o que fazer: a mudança deve ir para o design system (leve-a para lá primeiro) ou ser descartada. Nunca use `--forcar` sem essa resposta.
3. Sincronize (o mesmo comando, sem `--verificar`). Rode lint, testes e build do projeto e mostre o que mudou (`git diff --stat src/idf`).
4. Se a mudança do design system quebrou algo no projeto (um nome de classe, um parâmetro do núcleo), corrija **no projeto**, nunca na cópia.

## O que NÃO fazer

- Não pergunte fonte, raio, espaçamento, tema escuro ou estrutura de menu.
- Não edite os arquivos de `src/idf/`: são cópia do design system. Para mudar o menu, o tema ou as cores, mude no design system e sincronize (Modo 4). Não crie um estilo ou controlador próprio no lugar do que o design system já entrega.
- Não suba nada para repositórios remotos nem faça commit sem o usuário pedir.
