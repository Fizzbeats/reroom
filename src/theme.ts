// Design-Tokens: klar und hell, Blau als Hauptfarbe (wie im Businessplan), Gelb nur für Cashback.
// Muss mit src/styles/tokens.css übereinstimmen (siehe theme.test.ts).
export const FARBEN = {
  hell: {
    hintergrund: "#F4F5F7",
    karte: "#FFFFFF",
    text: "#14181F",
    textGedaempft: "#586272",
    primaer: "#1F5FD1",
    aufPrimaer: "#FFFFFF",
    akzent: "#FFD23F",
    aufAkzent: "#14181F",
    ampelGruen: "#1E8E5A",
    ampelGelb: "#A87400",
    ampelRot: "#C93A2B",
  },
  dunkel: {
    hintergrund: "#0F1217",
    karte: "#181C23",
    text: "#EEF1F5",
    textGedaempft: "#A3ACB9",
    primaer: "#7AA7FF",
    aufPrimaer: "#0F1217",
    akzent: "#FFD23F",
    aufAkzent: "#14181F",
    ampelGruen: "#4CC38A",
    ampelGelb: "#F2C94C",
    ampelRot: "#FF7A6B",
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
