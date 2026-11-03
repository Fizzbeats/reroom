// Messen auf einem Foto mit einem Referenzobjekt bekannter Größe (Bankkarte, A4-Blatt).
// Genau ist das nur für Dinge, die in derselben Ebene wie das Referenzobjekt liegen
// (z. B. Tür und Karte flach an die Tür gehalten, Foto gerade von vorn).

export interface Punkt {
  x: number;
  y: number;
}

export interface Referenz {
  id: string;
  name: string;
  /** Länge der gemessenen Kante in Zentimetern */
  laengeCm: number;
}

export const REFERENZEN: Referenz[] = [
  { id: "karte", name: "Bankkarte (lange Kante, 8,56 cm)", laengeCm: 8.56 },
  { id: "a4-lang", name: "A4-Blatt (lange Kante, 29,7 cm)", laengeCm: 29.7 },
  { id: "a4-kurz", name: "A4-Blatt (kurze Kante, 21,0 cm)", laengeCm: 21.0 },
];

export function abstandPx(a: Punkt, b: Punkt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Zentimeter pro Bildpunkt, aus den zwei angetippten Enden des Referenzobjekts. */
export function skalierung(referenzCm: number, a: Punkt, b: Punkt): number | undefined {
  const px = abstandPx(a, b);
  return px > 0 && referenzCm > 0 ? referenzCm / px : undefined;
}

/** Gemessene Strecke in ganzen Zentimetern. */
export function messeCm(a: Punkt, b: Punkt, cmProPx: number): number {
  return Math.round(abstandPx(a, b) * cmProPx);
}

/**
 * Warnung, wenn die Messung unsicher ist: Das Referenzobjekt sollte im Bild groß genug sein,
 * sonst wird der Fehler beim Hochrechnen groß.
 */
export function messHinweis(referenzPx: number, bildBreitePx: number): string | undefined {
  if (referenzPx < bildBreitePx * 0.08) {
    return "Das Referenzobjekt ist im Bild sehr klein. Geh näher heran, sonst wird die Messung ungenau.";
  }
  return undefined;
}
