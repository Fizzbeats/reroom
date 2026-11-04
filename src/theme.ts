// Design-Tokens, Variante 18 (Weinrot und Creme). Muss mit src/styles/tokens.css übereinstimmen (siehe theme.test.ts).
export const FARBEN = {
  hell: {
    hintergrund: "#FFF8EE",
    karte: "#F6E6DA",
    text: "#3A0F18",
    textGedaempft: "#7A5058",
    primaer: "#3A0F18",
    aufPrimaer: "#FFF8EE",
    akzent: "#FF5B2E",
    aufAkzent: "#3A0F18",
    ampelGruen: "#4C6B2E",
    ampelGelb: "#8A5F00",
    ampelRot: "#A8321F",
    pastell: "#F6E6DA",
    pastellStark: "#EBD3C3",
    aufPastell: "#7B1E2E",
    wein: "#7B1E2E",
    aufWein: "#FFF1E4",
  },
  dunkel: {
    hintergrund: "#1E0E12",
    karte: "#2C171C",
    text: "#FFF1E4",
    textGedaempft: "#C9ABB0",
    primaer: "#FFF1E4",
    aufPrimaer: "#3A0F18",
    akzent: "#FF6B3D",
    aufAkzent: "#2A0A11",
    ampelGruen: "#A9D17F",
    ampelGelb: "#F2C94C",
    ampelRot: "#FF8A78",
    pastell: "#3A1E24",
    pastellStark: "#4A2830",
    aufPastell: "#FFD9DC",
    wein: "#5E1A2A",
    aufWein: "#FFF1E4",
  },
} as const;

function leuchtdichte(hex: string): number {
  const kanaele = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = kanaele.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastverhältnis nach WCAG (1 bis 21). */
export function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}
