# Padrões IDF

Decisões que valem para todo sistema da Igreja IDF. A prova visual está nas páginas de conceito (ver README). Aqui ficam as regras.

## Arquitetura de tokens

| Camada | O que é | Quem muda |
|---|---|---|
| 1 · Primitivos | Escalas brutas (paleta, espaço 4-8-12-16-24-32, tipo, movimento) | Só o design system |
| 2 · Semânticos | Papéis: `--bg`, `--surface`, `--text`, `--line`, `--brand*`, `--ok`, `--warn`, `--danger`, `--info`, `--radius`, `--ctl` | Só o design system |
| 3 · Registro | **Operacional** (equipe: 8/12 px, controle 36 px) ou **expressivo** (público: 14/20 px, 44 px, Bricolage nos títulos). PDV usa escala de toque (56 px) | O gerador, pela descrição do sistema |
| 4 · Produto | Só a cor de marca: `--brand`, `--brand-on`, `--brand-text`, `--brand-soft`, `--brand-line`, `--hero` | O gerador, a partir de uma cor |

Estados (`ok`, `warn`, `danger`, `info`) são idênticos em todos os produtos. Todo token existe nos dois temas.

### Tokens de marca (todos derivados de uma cor)

- `--brand`: preenchimento (botão principal, aba ativa).
- `--brand-on`: texto sobre `--brand`, branco ou escuro conforme o contraste (AA, 4,5:1).
- `--brand-text`: links, abas e texto de marca. Ajustado até 4,5:1 sobre `--brand-soft`.
- `--brand-soft`: fundo suave.
- `--brand-line`: contorno, ícone, trilho de switch. Mínimo 3:1 sobre a superfície.
- `--hero`: fundo do menu lateral. Texto branco com 4,5:1.

## Animações padrão

Arquivo: `@idf/ui/motion.css` (importe depois de `tokens.css`). Duração e curva vêm de tokens; anime só `transform` e `opacity`.

| Token | Valor | Uso |
|---|---|---|
| `--t-toque` | 120 ms | Pressionar, hover |
| `--t-troca` | 200 ms | Trocar estado, fade, popover |
| `--t-entra` | 300 ms | Toast, sheet, menu lateral, lista |
| `--ease-entra`, `--ease-sai`, `--ease-troca` | curvas | Entrar desacelera, sair acelera, trocar é suave |

| Atributo ou classe | Efeito | Onde |
|---|---|---|
| `data-anim="fade"`, `"sobe"`, `"desce"`, `"escala"` | Entrada | Item novo, toast, menu da conta, modal |
| `data-anim="sheet"`, `"lateral"` | Entra por baixo ou pela esquerda | Carrinho e menu no celular |
| `data-anim="sai"` | Saída com fade | Remoção |
| `data-anim="erro"`, `"pulso"` | Balança, pulsa | Campo inválido; contador do carrinho ou sino |
| `data-anim-fundo` | Fade do fundo escurecido | Modal e sheet |
| `data-anim-lista` | Filhos em cascata (40 ms, até 8) | Listas e grades |
| `.idf-toque` | Escala 0,97 ao pressionar | Botões e tiles |
| `.idf-spin`, `.idf-skel` | Carregando | Botão em ação, esqueleto de lista |

Regras: movimento explica uma mudança, nunca enfeita; nada acima de 300 ms; o PDV não usa cascata (a venda não espera animação). Com `prefers-reduced-motion`, as durações vão a 0, o esqueleto para e o spinner desacelera.

## Marca em carregamento

Arquivo: `@idf/ui/marca.css` (depois de `motion.css`). O símbolo da igreja são seis traços, cada um uma camada de máscara; a cor padrão é a do texto (`--marca-cor` troca). Duas animações oficiais, só `transform` e `opacity`:

| Variante | Efeito | Uso |
|---|---|---|
| `data-marca="monta"` | Traços chegam dos cantos e se encaixam | Abertura do app (com o nome, `.idf-abertura`), troca de sistema |
| `data-marca="tracos"` | Traços acendem em sequência | Painel ou tela que demora, botão de destaque (`data-tam="pq"`), barra de sincronização |

Esqueleto (`.idf-skel`) continua nas listas e tabelas; spinner (`.idf-spin`) nas ações de menos de 1 s. O PDV nunca usa a marca. Com `prefers-reduced-motion`, os traços ficam inteiros e a marca pulsa de leve em opacidade. Não distorcer nem trocar a proporção. A fonte é PNG (símbolo com 259 px): nítida até uns 130 px; para mais, trocar as máscaras por SVG vetorial.

## Os cinco padrões

1. **Menu lateral igual ao do Pastinho.** 236 px na cor `--hero`, abas em pílula (ativa em branco), botão de recolher embaixo (80 px recolhido). Celular: barra superior com logo e barra de abas flutuante embaixo. Pontos de corte 699 px e 1024 px.
2. **Avatar e avisos no canto superior direito.** Pílula fixa com tema, sino (contador e painel) e avatar (menu da conta: Minha conta, Meus sistemas, tema, Sair).
3. **Venda simples (PDV e Lojinha).** Abre na venda. Destaques: Mais vendidos hoje, combos, categorias, selo de estoque baixo, Repetir última. Pagamento no carrinho. `F2` cobra, `Esc` volta. PDV abre com o menu recolhido.
4. **Front seguro.** Cookie `HttpOnly` e cabeçalho anti-CSRF, CSP rígida, sem HTML cru nem `eval`, service worker sem cache de dado pessoal ou financeiro, servidor recalcula dinheiro, idempotência na venda, reautenticação em ação sensível, telemetria sem dado pessoal, `npm audit` no CI.
5. **Erro sempre explicado.** Mensagem, código, status, número da requisição e detalhes técnicos. Stack sempre em sistema interno; fora da tela em sistema público (vai para o Sentry). Chave `mostrarStack` no pacote para mudar a política.

## Limpeza da stack antes de exibir ou copiar

Remover query string, e-mails, tokens (`Bearer`, `token=`, `sessao=`) e caminhos do computador; no máximo 12 linhas.

## PWA

Todo sistema é instalável (`manifest.webmanifest` com ícones 192, 512 e maskable, `display: standalone`, `theme_color` = `--hero`). Estados tratados: convite de instalação (Android e iPhone), sem conexão (fila com "Pendente de envio") e nova versão disponível. Dinheiro nunca é dado como pago antes da confirmação do servidor.
