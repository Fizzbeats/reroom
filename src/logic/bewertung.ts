// Bewertungen für Verkäufer. In der Demo sind die Werte der Beispiel-Verkäufer erfunden, aber je Name immer gleich.

export interface Bewertungen {
  anzahl: number;
  /** Durchschnitt von 1 bis 5, auf eine Stelle gerundet */
  schnitt: number;
}

function streuwert(text: string): number {
  let h = 7;
  for (const z of text) h = (h * 31 + z.charCodeAt(0)) % 100003;
  return h;
}

/** Erfundene, aber stabile Bewertung für einen Beispiel-Verkäufer (Schnitt 4,2 bis 5,0, 4 bis 40 Bewertungen). */
export function beispielBewertung(name: string): Bewertungen {
  const h = streuwert(name);
  return { anzahl: 4 + (h % 37), schnitt: Math.round((4.2 + ((h >> 3) % 9) / 10) * 10) / 10 };
}

/** Schnitt aus einzelnen Sternen, ohne Bewertung: undefined. */
export function ausSternen(sterne: number[]): Bewertungen | undefined {
  const gueltig = sterne.filter((s) => Number.isInteger(s) && s >= 1 && s <= 5);
  if (gueltig.length === 0) return undefined;
  const summe = gueltig.reduce((a, b) => a + b, 0);
  return { anzahl: gueltig.length, schnitt: Math.round((summe / gueltig.length) * 10) / 10 };
}

export function bewertungText(b: Bewertungen): string {
  const schnitt = b.schnitt.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${schnitt} von 5 · ${b.anzahl} ${b.anzahl === 1 ? "Bewertung" : "Bewertungen"}`;
}
