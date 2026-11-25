# IDF Design System

🔗 **Repositório:** <https://github.com/Thiago-lemes/IDF-design-system>

> **Em uma frase:** é o "kit de identidade" dos sistemas da Igreja IDF. Quem for criar um sistema novo diz **o nome, para que serve e a cor**, e todo o resto (aparência, menus, segurança, mensagens de erro) já vem pronto e igual aos demais.

---

## Para quem não é de tecnologia

### O problema que isso resolve

A Igreja IDF tem vários sistemas: **Kids** (check-in das crianças), **Lojinha**, **PDV** (o caixa), **Admin** e outros que ainda vão nascer. Se cada um fosse construído do zero, cada um ficaria com um visual, um menu e um jeito de errar diferentes. Quem usa vários sistemas se perderia, e cada novo sistema custaria semanas só para ficar "apresentável".

### A analogia

Pense numa **rede de franquias**. Toda loja da rede tem o mesmo padrão: uniforme, balcão, cardápio, regras de higiene. Mas cada loja pode ter seu nome e sua cor. Aqui é igual:

| Na franquia | Neste projeto |
| --- | --- |
| Manual da marca | Os **padrões** (`docs/padroes.md`) |
| Kit de montagem da loja (balcão, placas, uniforme) | Os **componentes e estilos** (`packages/ui`) |
| Consultor que monta a loja nova para você | O **gerador** (`packages/create-idf-app`) |
| Treinamento do gerente | As **skills** do Claude Code (`skills/`) |

### Ver como fica

Abra o arquivo [`docs/visual/index.html`](docs/visual/index.html) no navegador (duplo clique, sem instalar nada). São cinco páginas para mexer: a família visual, o catálogo de componentes (digite um nome e uma cor e veja tudo se ajustar), os padrões funcionando (menu, tela de venda, painel de erro), as animações padrão e a marca da igreja em carregamento. Os dados são exemplos inventados.

### O que uma pessoa ganha com isso

- **Quem usa os sistemas:** tudo parece uma coisa só. Aprendeu a usar um, sabe usar os outros.
- **Quem constrói:** o sistema novo nasce em minutos, já bonito, acessível e seguro.
- **A igreja:** menos retrabalho, menos erros e mais confiança, porque as boas práticas são aplicadas sempre da mesma forma.

### O que já vem decidido (você não precisa pensar nisso)

1. **Menu lateral igual em todos os sistemas.** No celular, ele vira uma barra de abas na parte de baixo da tela.
2. **Avatar e avisos no canto superior direito.** Sempre no mesmo lugar: tema claro/escuro, sino de avisos e menu da conta.
3. **Venda simples (PDV e Lojinha).** A tela abre já na venda, com os itens mais vendidos à mão, para atender rápido.
4. **Segurança desde o começo.** Dados pessoais e dinheiro são tratados com cuidado: o servidor sempre confere os valores, e ações sensíveis pedem confirmação de identidade.
5. **Erro sempre explicado.** Se algo der errado, a pessoa vê uma mensagem clara e um código para passar ao suporte, em vez de uma tela quebrada ou um aviso misterioso.

Além disso, **todo sistema pode ser instalado no celular** como se fosse um aplicativo (isso se chama PWA) e **o texto sempre fica legível**, porque a cor escolhida é ajustada automaticamente para ter bom contraste com o fundo.

### Um exemplo do dia a dia

Alguém da equipe quer criar o sistema da "Lojinha IDF". Ela informa:

- **Nome:** Lojinha IDF
- **Sobre:** estoque, vendas e caixa
- **Cor:** um verde (`#0b7a68`)

O gerador devolve o visual completo da Lojinha, com o verde aplicado em botões, menu e destaques, sem que ninguém precise escolher espaçamentos, tamanhos de letra ou tons de cinza.

---

## Para quem desenvolve

### Glossário rápido

| Termo | Em português simples |
| --- | --- |
| **Design system** | Conjunto de regras e peças visuais reutilizáveis. |
| **Token** | Um "apelido" para um valor visual. Em vez de repetir a cor `#0b7a68` em cem lugares, usa-se `--brand`; trocou o token, mudou em todo lugar. |
| **Contraste AA** | Padrão internacional de legibilidade: o texto precisa se destacar o bastante do fundo (razão mínima de 4,5 para 1). |
| **PWA** | Site que se instala no celular e funciona como aplicativo. |
| **Skill** | Receita que ensina o Claude Code (assistente de programação) a fazer uma tarefa do jeito da IDF. |
| **Plugin** | Pacote que entrega as skills prontas para instalar. |

### O que tem em cada pasta

| Pasta | O que é | Situação |
| --- | --- | --- |
| `packages/ui` | `@idf/ui`: tokens em CSS, animações (`motion.css`), marca em carregamento (`marca.css`), cálculo automático de cor com contraste AA, **o CSS do shell** (`shell.css`: menu lateral, topo com tema, sino e avatar, barra de abas no celular), **os primitivos** (`primitivos.css`: cartão, indicadores, estado vazio, carregando, painel de erro) e a **paleta de categorias** (`series.css`: `--serie-1` a `--serie-6`) | Pronto, com testes. **Falta:** botão, campos, tabela, selo, alerta, aviso rápido e diálogo (hoje vivem no CSS do hub e do Pastinho) |
| `packages/core` | `@idf/core`: TypeScript puro, sem framework. Cliente da API (cookie, cabeçalho anti-CSRF, erros no formato Problem Details), painel de erro (remove dado sensível e gera o código de suporte), menu recolhido, tema claro/escuro e o estado que liga tudo a React, Vue ou JS puro | Pronto, com testes. Em uso no hub; o Pastinho ainda não migrou |
| `packages/create-idf-app` | O gerador (`idf-app.mjs`): recebe nome + cor e entrega `tema.css`, `manifest.webmanifest` e `idf.json`. E o **sincronizador** (`idf-sync.mjs`): copia para o projeto o CSS e o núcleo e confere se a cópia está em dia | Pronto, com testes. **Falta:** gerar o projeto inteiro (menu, service worker, ícones) |
| `skills/idf-novo-sistema` | Skill para criar sistema novo, escrever telas e revisar | Pronta (v0.1) |
| `skills/idf-adotar-arquitetura` | Skill que adapta um projeto **que já existe** ao padrão, por fases (começa com um diagnóstico). Leva junto `references/arquitetura-front.md` | Pronta (v0.1) |
| `.claude-plugin` | Empacota as skills como plugin | Pronto |
| `docs/padroes.md` | Os cinco padrões, a arquitetura de tokens, as animações e a marca em carregamento, em detalhe | Pronto |
| `docs/visual/` | Páginas HTML autônomas para o desenvolvedor ver e mexer (conceito, componentes, padrões, animações, marca) | Prontas. São demonstrações: ainda não são o código real do `@idf/ui` |

### Como um sistema usa o design system

**O design system é um guia, não uma dependência.** Nenhum sistema da IDF importa pacotes daqui para compilar. Os nomes `@idf/ui` e `@idf/core` são só os nomes das pastas desta casa, não pacotes para instalar.

O que acontece, em português simples: quem cria ou atualiza um sistema **consulta** o design system (pelas skills) e leva uma **cópia** dos arquivos que precisa para dentro do projeto, na pasta `src/idf/`. Daí em diante o projeto anda sozinho e compila em qualquer máquina, sem este repositório por perto. É como copiar a receita para o seu caderno.

- **A cópia é só leitura.** Cada arquivo tem um cabeçalho dizendo de onde veio, e o `idf-lock.json` guarda a impressão digital de cada um. Para mudar o menu, o tema ou as cores, muda-se **aqui** e sincroniza-se de novo.
- **Atualizar é um comando** (`idf-sync.mjs`) ou uma frase para a skill ("atualize o design system neste projeto"). Ele mostra o que mudou, avisa se alguém editou a cópia à mão e não sobrescreve sem permissão.
- **O custo desse modelo é o desvio:** a cópia é uma foto de um momento. Se ninguém sincronizar, o projeto envelhece. Por isso existe o `--verificar`.

### Qual skill escolher?

- **Vou criar um sistema do zero** → `idf-novo-sistema`
- **Já tenho um sistema e quero alinhá-lo ao padrão** → `idf-adotar-arquitetura`
- **O design system mudou e quero atualizar um projeto** → `idf-novo-sistema` (Modo 4, sincronizar)

### Como usar

**1. Rodar os testes** (precisa de Node 20 ou mais recente; não há dependências para instalar):

```bash
npm test
```

**2. Gerar o tema de um sistema:**

```bash
node packages/create-idf-app/bin/idf-app.mjs \
  --nome "Lojinha IDF" --sobre "Estoque, vendas e caixa" --cor "#0b7a68" --saida ./meu-app
```

O que cada parte significa:

| Opção | Para que serve |
| --- | --- |
| `--nome` | Nome do sistema |
| `--sobre` | Uma frase dizendo para que ele serve |
| `--cor` | A cor da marca, em formato hexadecimal (ex.: `#0b7a68`) |
| `--saida` | Pasta onde os arquivos serão criados |
| `--publico` *(opcional)* | Use quando o sistema for para o público em geral: botões e letras maiores, visual mais acolhedor. Sem ele, o visual é o "de equipe", mais compacto |
| `--simular` *(opcional)* | Só mostra o relatório de contraste, sem criar nenhum arquivo |

**3. Levar o design system para um projeto (e atualizar depois):**

```bash
# copia o CSS e o núcleo para src/idf e grava o idf-lock.json
node packages/create-idf-app/bin/idf-sync.mjs --destino ../meu-app/src/idf

# só confere: está em dia? alguém editou a cópia? (sai com código 1 se algo divergir)
node packages/create-idf-app/bin/idf-sync.mjs --destino ../meu-app/src/idf --verificar
```

`--forcar` sobrescreve um arquivo que foi editado à mão no projeto; use só depois de decidir o que fazer com a edição.

### Como instalar a skill

**Opção recomendada: plugin do Claude Code** (o repositório já está publicado):

```
/plugin marketplace add Thiago-lemes/IDF-design-system
/plugin install idf-design-system
```

**Opção manual:** copiar a pasta da skill para `.claude/skills/` do seu projeto.

> A `idf-adotar-arquitetura` funciona sozinha, pois leva a arquitetura junto. Já a `idf-novo-sistema` também precisa do gerador (`packages/create-idf-app`) e de `docs/padroes.md`. Por isso, para ela, prefira o plugin.

---

## Próximos passos

O que já foi feito: o shell (menu lateral, topo, barra de abas), o painel de erro, os primitivos, a paleta de categorias e o `@idf/core`, usados pelo hub da secretaria. Em ordem de prioridade:

1. **Componentes prontos que faltam:** botão, campos, alertas, aviso rápido (toast), diálogo, tabela, selo. Hoje estão no CSS do hub e do Pastinho (`web/src/estilos.css`, `componentes/`); extrair para o `@idf/ui`.
2. **Migrar o Pastinho** para usar a cópia sincronizada do shell, do núcleo e das séries (`idf-sync.mjs`), em um passo separado, para não misturar mudanças nos dois sistemas.
3. **`@idf/react`:** o adaptador React fino hoje mora no hub (`web/src/compartilhado/shell/`). Só vira pacote quando houver um segundo sistema em React.
4. **Venda e uso offline:** tela de venda e o suporte a PWA (instalação, funcionamento sem internet, fila de envio).
5. **Guardas automáticas:** o hub já barra cor solta, HTML cru e arquivo grande no ESLint; levar essas regras para um pacote comum e acrescentar `npm audit` no CI.
6. **Como os sistemas recebem o design system:** decidido. Nenhum sistema depende dele; cada um tem uma cópia em `src/idf`, mantida pelo `idf-sync.mjs` (ver "Como um sistema usa o design system").
7. **Gerador completo e prova real:** gerar um sistema de ponta a ponta (menu, service worker, ícones).

## Quer saber mais?

Os detalhes técnicos de cada regra (tamanhos, cores derivadas, política de erros, PWA) estão em [`docs/padroes.md`](docs/padroes.md).
