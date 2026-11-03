// Rechnen mit Punkten aus der AR-Kamera (WebXR). Koordinaten in Metern, y zeigt nach oben.

export interface Punkt3D {
  x: number;
  y: number;
  z: number;
}

/** Direkter Abstand zweier Punkte in ganzen Zentimetern (z. B. Türbreite, Türhöhe). */
export function abstandCm(a: Punkt3D, b: Punkt3D): number {
  return Math.round(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) * 100);
}

/** Abstand am Boden entlang, Höhenunterschiede werden ignoriert. */
export function bodenAbstandCm(a: Punkt3D, b: Punkt3D): number {
  return Math.round(Math.hypot(b.x - a.x, b.z - a.z) * 100);
}

/** Höhenunterschied zweier Punkte in Zentimetern (z. B. Boden bis Decke). */
export function hoeheCm(unten: Punkt3D, oben: Punkt3D): number {
  return Math.round(Math.abs(oben.y - unten.y) * 100);
}

/**
 * Raummaße aus vier Bodenecken, im Kreis angetippt.
 * Breite = Mittel aus 1. und 3. Seite, Tiefe = Mittel aus 2. und 4. Seite.
 * So gleichen sich kleine Fehler beim Antippen aus.
 */
export function raumAusEcken(ecken: Punkt3D[]): { breiteCm: number; tiefeCm: number } | undefined {
  if (ecken.length !== 4) return undefined;
  const seite = (i: number) => bodenAbstandCm(ecken[i]!, ecken[(i + 1) % 4]!);
  return {
    breiteCm: Math.round((seite(0) + seite(2)) / 2),
    tiefeCm: Math.round((seite(1) + seite(3)) / 2),
  };
}
