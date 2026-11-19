// Deriva os tokens de marca de UMA cor, nos dois temas, garantindo contraste AA (WCAG).
// Puro e sem dependências: usado pelo gerador (Node) e pode ser importado no app.

const CLARO = { superficie: "#ffffff", texto: "#14162e" };
const ESCURO = { superficie: "#181a30", texto: "#14162e" };

export function hexParaRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbParaHex(rgb) {
  return "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

function rgbParaHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslParaRgb(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function luminancia(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a, b) {
  const x = luminancia(hexParaRgb(a)), y = luminancia(hexParaRgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Move a luminosidade (dir = -1 escurece, +1 clareia) só até atingir o contraste mínimo. */
export function ajustar(hex, fundo, minimo, dir) {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  let atual = hex;
  for (let i = 0; i < 100 && contraste(atual, fundo) < minimo; i++) {
    hsl[2] += dir;
    if (hsl[2] < 0 || hsl[2] > 100) break;
    atual = rgbParaHex(hslParaRgb(...hsl));
  }
  return atual;
}

export function validarHex(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** Tokens de marca de uma cor para um tema ("claro" | "escuro"). */
export function tokensDeMarca(hex, tema = "claro") {
  if (!validarHex(hex)) throw new Error(`Cor inválida: ${hex}. Use o formato #rrggbb.`);
  const escuro = tema === "escuro";
  const base = escuro ? ESCURO : CLARO;
  const hsl = rgbParaHsl(hexParaRgb(hex));

  let preenchimento = hex;
  if (escuro && contraste(preenchimento, base.superficie) < 3) preenchimento = ajustar(preenchimento, base.superficie, 3, 1);

  const sobre = contraste("#ffffff", preenchimento) >= contraste(CLARO.texto, preenchimento) ? "#ffffff" : CLARO.texto;
  const suave = rgbParaHex(hslParaRgb(hsl[0], Math.min(hsl[1], escuro ? 45 : 70), escuro ? 20 : 94));
  const texto = ajustar(hex, suave, 4.5, escuro ? 1 : -1);
  const heroi = escuro ? rgbParaHex(hslParaRgb(hsl[0], Math.min(hsl[1], 55), 30)) : ajustar(hex, "#ffffff", 4.5, -1);

  return {
    "--brand": preenchimento,
    "--brand-on": sobre,
    "--brand-text": texto,
    "--brand-soft": suave,
    "--brand-line": ajustar(hex, base.superficie, 3, escuro ? 1 : -1),
    "--hero": heroi,
  };
}

/** Relatório de contraste, para o gerador mostrar e o CI conferir. */
export function relatorio(hex, tema = "claro") {
  const t = tokensDeMarca(hex, tema);
  const superficie = (tema === "escuro" ? ESCURO : CLARO).superficie;
  return [
    { regra: "Texto sobre o botão principal", razao: contraste(t["--brand-on"], t["--brand"]), minimo: 4.5 },
    { regra: "Texto de marca (links, abas)", razao: contraste(t["--brand-text"], t["--brand-soft"]), minimo: 4.5 },
    { regra: "Ícone e contorno de marca", razao: contraste(t["--brand-line"], superficie), minimo: 3 },
    { regra: "Texto branco sobre o menu lateral", razao: contraste("#ffffff", t["--hero"]), minimo: 4.5 },
  ].map((r) => ({ ...r, ok: r.razao >= r.minimo }));
}
