import type { Moebel, Stil } from "../models/types";

export interface Wunsch {
  budget: number;
  stile: Stil[];
  farben: string[];
}

export interface Treffer {
  moebel: Moebel;
  punkte: number;
}

/** Punkte: passender Stil +3, passende Farbe +2, gebraucht und unter 10 km +1. */
export function bewerte(m: Moebel, w: Wunsch): number {
  let punkte = 0;
  if (m.stile.some((s) => w.stile.includes(s))) punkte += 3;
  if (m.farben.some((f) => w.farben.includes(f))) punkte += 2;
  if (m.zustand === "gebraucht" && m.entfernungKm !== undefined && m.entfernungKm < 10) punkte += 1;
  return punkte;
}

/** Filtert nach Budget und sortiert nach Punkten (absteigend), bei Gleichstand nach Preis (aufsteigend). */
export function findePassende(katalog: Moebel[], w: Wunsch): Treffer[] {
  return katalog
    .filter((m) => m.preis <= w.budget)
    .map((moebel) => ({ moebel, punkte: bewerte(moebel, w) }))
    .sort((a, b) => b.punkte - a.punkte || a.moebel.preis - b.moebel.preis);
}
