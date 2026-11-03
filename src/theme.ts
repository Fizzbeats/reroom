// Design-Tokens. Muss mit src/styles/tokens.css übereinstimmen (siehe theme.test.ts).
export const FARBEN = {
  hell: {
    hintergrund: "#F7F4EF",
    karte: "#FFFFFF",
    text: "#1F2A27",
    textGedaempft: "#55625E",
    primaer: "#2F6B5E",
    aufPrimaer: "#FFFFFF",
    akzent: "#E07A5F",
    ampelGruen: "#2E8B57",
    ampelGelb: "#B07F00",
    ampelRot: "#C0392B",
  },
  dunkel: {
    hintergrund: "#16201D",
    karte: "#1F2B28",
    text: "#EDEBE6",
    textGedaempft: "#A9B4B0",
    primaer: "#6FBFAE",
    aufPrimaer: "#0F1A17",
    akzent: "#E8917B",
    ampelGruen: "#4CAF7A",
    ampelGelb: "#F0BE2E",
    ampelRot: "#E8604F",
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
