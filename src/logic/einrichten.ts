import type { Kategorie, Moebel, Raum } from "../models/types";

// Stellt Möbel automatisch in den Grundriss (Draufsicht, Zentimeter).
// Koordinaten: x nach rechts (Raumbreite), y nach unten (Raumtiefe), Ursprung oben links.
// Die Tür liegt unten links in der Wand und schwenkt in den Raum, dort bleibt Platz frei.

export interface Platzierung {
  moebel: Moebel;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Rechteck {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Vom Nutzer festgelegter Platz (Möbel mit dem Finger verschoben), in cm. */
export interface FestePlatz {
  x: number;
  y: number;
  /** true = um 90° gedreht (Breite und Tiefe vertauscht) */
  gedreht: boolean;
}

export const TUER_ABSTAND_CM = 20; // Tür beginnt 20 cm neben der linken Ecke
const WANDABSTAND_CM = 5;
const RASTER_CM = 10;

/** Freizuhaltende Fläche, in die die Tür aufschwenkt. */
export function tuerBereich(raum: Raum): Rechteck {
  const b = raum.tuerBreiteCm;
  return { x: TUER_ABSTAND_CM, y: raum.tiefeCm - b, w: b, h: b };
}

export function ueberlappt(a: Rechteck, b: Rechteck): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

const amBoden = (k: Kategorie) => k === "teppich";

/** Bevorzugte Plätze je Kategorie, in Reihenfolge. Danach wird das Raster abgesucht. */
function wunschplaetze(k: Kategorie, w: number, h: number, raum: Raum): { x: number; y: number }[] {
  const B = raum.breiteCm, T = raum.tiefeCm, a = WANDABSTAND_CM;
  const mitte = { x: (B - w) / 2, y: (T - h) / 2 };
  switch (k) {
    case "sofa":
    case "bett":
      return [{ x: (B - w) / 2, y: a }];
    case "schrank":
    case "regal":
      return [{ x: B - w - a, y: T - h - a }, { x: B - w - a, y: a }];
    case "lampe":
      return [{ x: a, y: a }, { x: B - w - a, y: a }];
    case "teppich":
    case "tisch":
      return [mitte];
    case "stuhl":
      return [{ x: mitte.x + w + 20, y: mitte.y }, mitte];
  }
}

function frei(r: Rechteck, k: Kategorie, raum: Raum, belegt: Platzierung[]): boolean {
  if (r.x < 0 || r.y < 0 || r.x + r.w > raum.breiteCm || r.y + r.h > raum.tiefeCm) return false;
  if (!amBoden(k) && ueberlappt(r, tuerBereich(raum))) return false;
  // Teppiche dürfen unter anderen Möbeln liegen, aber nicht aufeinander
  return belegt.every((p) => amBoden(k) !== amBoden(p.moebel.kategorie) || !ueberlappt(r, p));
}

/**
 * Platziert die Möbel nacheinander: erst am bevorzugten Platz, sonst an der ersten freien Stelle im Raster.
 * Das Möbel darf um 90° gedreht werden. Was nirgends passt, landet in `nichtPlatziert`.
 */
export function einrichten(raum: Raum, moebel: Moebel[], feste: Record<string, FestePlatz> = {}): { platziert: Platzierung[]; nichtPlatziert: Moebel[] } {
  const platziert: Platzierung[] = [];
  const nichtPlatziert: Moebel[] = [];
  // Teppiche zuerst, damit Tisch und Sofa darauf stehen können
  const reihenfolge = [...moebel].sort((a, b) => Number(amBoden(b.kategorie)) - Number(amBoden(a.kategorie)));

  // Was der Nutzer festgelegt hat, steht zuerst. Passt der Platz nicht mehr (Raum wurde geändert), sucht die App neu.
  const gesetzt = new Set<string>();
  for (const m of reihenfolge) {
    const f = feste[m.id];
    if (!f) continue;
    const w = f.gedreht ? m.masseCm.tiefe : m.masseCm.breite;
    const h = f.gedreht ? m.masseCm.breite : m.masseCm.tiefe;
    if (frei({ x: f.x, y: f.y, w, h }, m.kategorie, raum, platziert)) {
      platziert.push({ moebel: m, x: f.x, y: f.y, w, h });
      gesetzt.add(m.id);
    }
  }

  for (const m of reihenfolge) {
    if (gesetzt.has(m.id)) continue;
    const lagen = [
      { w: m.masseCm.breite, h: m.masseCm.tiefe },
      { w: m.masseCm.tiefe, h: m.masseCm.breite },
    ];
    let gefunden: Platzierung | undefined;
    for (const { w, h } of lagen) {
      const kandidaten = [...wunschplaetze(m.kategorie, w, h, raum)];
      for (let y = 0; y + h <= raum.tiefeCm; y += RASTER_CM) {
        for (let x = 0; x + w <= raum.breiteCm; x += RASTER_CM) kandidaten.push({ x, y });
      }
      const platz = kandidaten.find((p) => frei({ ...p, w, h }, m.kategorie, raum, platziert));
      if (platz) {
        gefunden = { moebel: m, x: Math.round(platz.x), y: Math.round(platz.y), w, h };
        break;
      }
    }
    if (gefunden) platziert.push(gefunden);
    else nichtPlatziert.push(m);
  }
  return { platziert, nichtPlatziert };
}

/**
 * Darf das Möbel an dieser Stelle stehen? Im Raum, nicht im Schwenkbereich der Tür,
 * nicht auf einem anderen Möbel (Teppiche dürfen unter Möbeln liegen).
 */
export function kannStehen(raum: Raum, platziert: Platzierung[], moebel: Moebel, rect: Rechteck): boolean {
  return frei(rect, moebel.kategorie, raum, platziert.filter((p) => p.moebel.id !== moebel.id));
}
