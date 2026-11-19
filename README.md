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

Abra o arquivo [`docs/visual/index.html`](docs/visual/index.html) no navegador (duplo clique, sem instalar nada). São três páginas para mexer: a família visual, o catálogo de componentes (digite um nome e uma cor e veja tudo se ajustar) e os padrões funcionando (menu, tela de venda, painel de erro). Os dados são exemplos inventados.

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
| `packages/ui` | `@idf/ui`: os estilos (tokens em CSS) e o cálculo automático de cor com contraste AA | Tokens e cor prontos, com testes. **Falta:** componentes React, menu/shell e painel de erro |
| `packages/create-idf-app` | O gerador: recebe nome + cor e entrega `tema.css`, `manifest.webmanifest` e `idf.json` | Pronto, com testes. **Falta:** gerar o projeto inteiro (menu, service worker, ícones) |
| `skills/idf-novo-sistema` | Skill para criar sistema novo, escrever telas e revisar | Pronta (v0.1) |
| `skills/idf-adotar-arquitetura` | Skill que adapta um projeto **que já existe** ao padrão, por fases (começa com um diagnóstico). Leva junto `references/arquitetura-front.md` | Pronta (v0.1) |
| `.claude-plugin` | Empacota as skills como plugin | Pronto |
| `docs/padroes.md` | Os cinco padrões e a arquitetura de tokens, em detalhe | Pronto |
| `docs/visual/` | Páginas HTML autônomas para o desenvolvedor ver e mexer (conceito, componentes, padrões) | Prontas. São demonstrações: ainda não são o código real do `@idf/ui` |

### Qual skill escolher?

- **Vou criar um sistema do zero** → `idf-novo-sistema`
- **Já tenho um sistema e quero alinhá-lo ao padrão** → `idf-adotar-arquitetura`

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

Em ordem de prioridade:

1. **Componentes prontos:** extrair do Pastinho (`web/src/estilos.css`, `componentes/`) botão, campos, alertas, avisos rápidos (toast), diálogo, tabela, selo e indicadores (KPI) para o `@idf/ui`.
2. **Estrutura da tela:** menu lateral, topo com avatar e avisos, barra inferior no celular e o painel de erro (que remove dados sensíveis antes de mostrar detalhes técnicos).
3. **Venda e uso offline:** tela de venda e o suporte a PWA (instalação, funcionamento sem internet, fila de envio).
4. **Guardas automáticas:** regras que barram cor solta e HTML inseguro, e verificação de segurança das dependências a cada alteração (CI com `npm audit`).
5. **Gerador completo e prova real:** gerar a Lojinha de verdade, de ponta a ponta.

## Quer saber mais?

Os detalhes técnicos de cada regra (tamanhos, cores derivadas, política de erros, PWA) estão em [`docs/padroes.md`](docs/padroes.md).
