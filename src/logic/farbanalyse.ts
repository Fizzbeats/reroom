// Erkennt die Hauptfarben eines Fotos und ordnet sie den Farben von ReRoom zu.
// Das ist keine KI: Es zählt Bildpunkte und nimmt die nächstliegende Farbe. Den Stil schlägt eine einfache Regel vor, der Nutzer entscheidet.

import type { Stil } from "../models/types";

const PALETTE: Record<string, [number, number, number]> = {
  grau: [163, 167, 171],
  weiss: [236, 234, 229],
  holz: [201, 160, 110],
  schwarz: [46, 46, 46],
  braun: [128, 85, 58],
  terrakotta: [201, 105, 76],
};

const quadrat = (a: number, b: number) => (a - b) * (a - b);

const FARBIGE = ["holz", "braun", "terrakotta"] as const;
const UNBUNT_GRENZE = 28; // Unterschied zwischen größtem und kleinstem Farbwert: darunter gilt ein Punkt als grau

/**
 * Ordnet einen Bildpunkt einer Farbe von ReRoom zu.
 * Fast farblose Punkte (Wände, Schatten) werden nach Helligkeit zu schwarz, grau oder weiß,
 * alle anderen nach dem nächsten Farbton zu holz, braun oder terrakotta.
 */
export function naechsteFarbe(r: number, g: number, b: number): string {
  const farbigkeit = Math.max(r, g, b) - Math.min(r, g, b);
  if (farbigkeit < UNBUNT_GRENZE) {
    const helligkeit = 0.299 * r + 0.587 * g + 0.114 * b;
    return helligkeit < 75 ? "schwarz" : helligkeit < 200 ? "grau" : "weiss";
  }
  let beste: string = FARBIGE[0];
  let abstand = Infinity;
  for (const name of FARBIGE) {
    const [pr, pg, pb] = PALETTE[name]!;
    const d = quadrat(r, pr) + quadrat(g, pg) + quadrat(b, pb);
    if (d < abstand) {
      abstand = d;
      beste = name;
    }
  }
  return beste;
}

/**
 * Die häufigsten Farben aus RGBA-Bildpunkten (4 Werte je Punkt), die mindestens `mindestAnteil` des Bildes füllen.
 * Es wird nur jeder `schritt`-te Punkt gezählt, damit große Fotos schnell gehen.
 */
export function farbenAusPixeln(daten: ArrayLike<number>, maxFarben = 2, mindestAnteil = 0.12, schritt = 4): string[] {
  const zaehler = new Map<string, number>();
  let gesamt = 0;
  for (let i = 0; i + 3 < daten.length; i += 4 * schritt) {
    if (daten[i + 3]! < 128) continue; // durchsichtig
    const name = naechsteFarbe(daten[i]!, daten[i + 1]!, daten[i + 2]!);
    zaehler.set(name, (zaehler.get(name) ?? 0) + 1);
    gesamt++;
  }
  if (gesamt === 0) return [];
  return [...zaehler.entries()]
    .filter(([, n]) => n / gesamt >= mindestAnteil)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxFarben)
    .map(([name]) => name);
}

/** Schlägt aus den Bildfarben einen Stil vor. Nur ein Vorschlag, der Nutzer entscheidet. */
export function stilVorschlag(farben: string[]): Stil | undefined {
  const hat = (f: string) => farben.includes(f);
  if (farben.length === 0) return undefined;
  if (hat("terrakotta")) return "boho";
  if (hat("schwarz") && hat("weiss")) return "modern";
  if (hat("schwarz")) return "industrial";
  if (hat("braun")) return "vintage";
  if (hat("holz")) return "skandi";
  if (hat("grau")) return "modern";
  if (hat("weiss")) return "skandi";
  return undefined;
}
