// Design-Tokens im Stil „Wohnstube" (Vintage). Muss mit src/styles/tokens.css übereinstimmen (siehe theme.test.ts).
export const FARBEN = {
  hell: {
    hintergrund: "#F4E8CC",
    karte: "#FBF3DE",
    text: "#3A2B1A",
    textGedaempft: "#6B5A3E",
    primaer: "#3F5B3A",
    aufPrimaer: "#FBF3DE",
    akzent: "#D9A11E",
    aufAkzent: "#3A2B1A",
    ampelGruen: "#3A7A3A",
    ampelGelb: "#9A6C00",
    ampelRot: "#A8321F",
  },
  dunkel: {
    hintergrund: "#1E1912",
    karte: "#2A231A",
    text: "#F1E6CC",
    textGedaempft: "#C2B293",
    primaer: "#9CBF8F",
    aufPrimaer: "#1E1912",
    akzent: "#E0B04A",
    aufAkzent: "#1E1912",
    ampelGruen: "#6DBF6D",
    ampelGelb: "#E8BE4E",
    ampelRot: "#F07A62",
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
