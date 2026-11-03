// Gemeinsame Datenmodelle (alle Maße in Zentimetern, Preise in Euro)
export type Kategorie = "sofa" | "bett" | "schrank" | "tisch" | "stuhl" | "regal" | "lampe" | "teppich";
export type Zustand = "neu" | "gebraucht";
export type Stil = "skandi" | "modern" | "industrial" | "boho" | "vintage";

export interface Masse {
  breite: number;
  tiefe: number;
  hoehe: number;
}

export interface Moebel {
  id: string;
  name: string;
  kategorie: Kategorie;
  zustand: Zustand;
  preis: number;
  anbieter: string;
  entfernungKm?: number;
  masseCm: Masse;
  stile: Stil[];
  farben: string[];
  beschreibung: string;
  /** Produktfoto des Anbieters. Fehlt es, zeigt die App eine Zeichnung der Kategorie. */
  bildUrl?: string;
  /** Hervorgehobene Inserate (1,49 €) stehen in der Liste oben */
  hervorgehoben?: boolean;
}

export interface Raum {
  id: string;
  name: string;
  breiteCm: number;
  tiefeCm: number;
  hoeheCm: number;
  tuerBreiteCm: number;
  tuerHoeheCm: number;
  treppenhausBreiteCm: number;
}

export const ALLE_STILE: Stil[] = ["skandi", "modern", "industrial", "boho", "vintage"];
export const ALLE_FARBEN = ["grau", "weiss", "holz", "schwarz", "braun", "terrakotta"];
