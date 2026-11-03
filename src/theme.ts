// Design-Tokens: Weiß und Schwarz als Basis, Orange nur als kleiner Marken-Akzent,
// Grün nur für den Preisvorteil. Muss mit src/styles/tokens.css übereinstimmen (siehe theme.test.ts).
export const FARBEN = {
  hell: {
    hintergrund: "#FFFFFF",
    karte: "#F1F1EF",
    text: "#111111",
    textGedaempft: "#686868",
    primaer: "#111111",
    aufPrimaer: "#FFFFFF",
    akzent: "#FF5B2E",
    aufAkzent: "#111111",
    ampelGruen: "#12924F",
    ampelGelb: "#A87400",
    ampelRot: "#D63A2A",
  },
  dunkel: {
    hintergrund: "#0E0E0E",
    karte: "#1C1C1C",
    text: "#F2F2F2",
    textGedaempft: "#A6A6A6",
    primaer: "#F2F2F2",
    aufPrimaer: "#0E0E0E",
    akzent: "#FF6B3D",
    aufAkzent: "#0E0E0E",
    ampelGruen: "#3FCB7E",
    ampelGelb: "#F2C94C",
    ampelRot: "#FF6B5B",
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
