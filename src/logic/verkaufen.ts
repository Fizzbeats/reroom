// Gebraucht verkaufen, wie im Businessplan beschrieben:
// 1. Verkaufen (Maße und Fotos, kostenlos)  2. Bezahlen (Zahlungsdienstleister hält das Geld)
// 3. Abholen oder Transport  4. Übergabe per QR-Code, erst dann bekommt der Verkäufer sein Geld.
// Wer den Erlös als Guthaben nutzt, bekommt 5 % Bonus. Bezahlung und Auszahlung sind hier eine Demo.

import type { Kategorie, Masse, Moebel } from "../models/types";
import { liesCm } from "./messSchritte";
import { alsCent, kaeuferschutzCent, TRANSPORT_CENT } from "./preisRechner";

export type Status = "online" | "verkauft" | "uebergeben";
export type Erloesart = "auszahlung" | "guthaben";
export type Abholung = "abholung" | "transport";

export const ZUSTAENDE = ["Wie neu", "Gut", "Mit Gebrauchsspuren"] as const;
export type ZustandText = (typeof ZUSTAENDE)[number];

export const HERVORHEBEN_CENT = 149; // Inserat hervorheben: 1,49 €
export const GUTHABEN_BONUS_PROZENT = 5;
export const TRANSPORT_AB_CENT = TRANSPORT_CENT; // Transport-Partner ab 40 €
export const TRANSPORT_ANTEIL_PROZENT = 15; // davon erhält ReRoom

export interface Inserat {
  id: string;
  titel: string;
  kategorie: Kategorie;
  farbe: string;
  zustand: ZustandText;
  masseCm: Masse;
  /** Geschätzter Neupreis in Euro, nur für den Preisvorschlag */
  neupreis: number;
  preis: number;
  fotos: string[];
  hervorgehoben: boolean;
  abholung: Abholung;
  status: Status;
  /** Sechsstelliger Code, steckt im QR-Code der Übergabe */
  code: string;
  erloesart?: Erloesart;
  /** Sterne (1 bis 5), die der Käufer nach der Übergabe gegeben hat */
  bewertung?: number;
  erstelltAm: string;
}

/** Eingaben im Einstell-Assistenten, alles noch als Text. */
export interface Entwurf {
  fotos: string[];
  titel: string;
  kategorie?: Kategorie;
  farbe?: string;
  zustand?: ZustandText;
  breite: string;
  tiefe: string;
  hoehe: string;
  neupreis: string;
  preis: string;
  abholung: Abholung;
  hervorgehoben: boolean;
}

export const LEERER_ENTWURF: Entwurf = {
  fotos: [], titel: "", breite: "", tiefe: "", hoehe: "", neupreis: "", preis: "", abholung: "abholung", hervorgehoben: false,
};

export const MAX_FOTOS = 4;

/** Euro aus Text: „180“, „180,50“, „180 €“. */
export function euroAusText(text: string): number | undefined {
  const t = text.trim().replace(/\s*(€|eur|euro)$/i, "");
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(t)) return undefined;
  const wert = Number(t.replace(",", "."));
  return wert > 0 ? wert : undefined;
}

const MASS_BEREICH = { min: 5, max: 400 };

function masse(e: Entwurf): Masse | undefined {
  const [b, t, h] = [e.breite, e.tiefe, e.hoehe].map((x) => liesCm(x)?.cm);
  if (!b || !t || !h) return undefined;
  return { breite: b, tiefe: t, hoehe: h };
}

/** Prüft einen Schritt des Assistenten. Gibt den Hinweis zurück, oder nichts wenn alles stimmt. */
export function pruefeSchritt(schritt: number, e: Entwurf): string | undefined {
  switch (schritt) {
    case 0:
      return e.fotos.length === 0 ? "Füge mindestens ein Foto hinzu. Das erste Foto zeigt das ganze Möbel." : undefined;
    case 1:
      if (e.titel.trim().length < 3) return "Gib dem Möbel einen Namen, zum Beispiel „Sofa Lund“.";
      if (!e.kategorie) return "Wähle aus, was für ein Möbel es ist.";
      if (!e.farbe) return "Wähle die Hauptfarbe.";
      if (!e.zustand) return "Wähle den Zustand.";
      return undefined;
    case 2: {
      const m = masse(e);
      if (!m) return "Trage Breite, Tiefe und Höhe in cm ein.";
      const aus = [m.breite, m.tiefe, m.hoehe].some((x) => x < MASS_BEREICH.min || x > MASS_BEREICH.max);
      return aus ? `Die Maße sollten zwischen ${MASS_BEREICH.min} und ${MASS_BEREICH.max} cm liegen.` : undefined;
    }
    case 3: {
      const p = euroAusText(e.preis);
      if (!p) return "Gib deinen Preis in Euro ein, zum Beispiel 120.";
      return p > 20000 ? "Für diesen Preis brauchst du ein anderes Portal." : undefined;
    }
    default:
      return undefined;
  }
}

// ---------- Geld ----------

/** Das zahlt der Käufer: Preis plus Käuferschutz (4 % + 0,50 €). */
export function kaeuferZahltCent(preisEuro: number): number {
  const cent = alsCent(preisEuro);
  return cent + kaeuferschutzCent(cent);
}

/** Das bekommt der Verkäufer: der volle Preis, Einstellen ist kostenlos. */
export function erloesCent(preisEuro: number): number {
  return alsCent(preisEuro);
}

/** Als Guthaben gibt es 5 % Bonus obendrauf. */
export function guthabenCent(erloes: number): number {
  return erloes + Math.round((erloes * GUTHABEN_BONUS_PROZENT) / 100);
}

export function transportAnteilCent(transportCent: number = TRANSPORT_AB_CENT): number {
  return Math.round((transportCent * TRANSPORT_ANTEIL_PROZENT) / 100);
}

// ---------- Übergabe ----------

/** Sechsstelliger Code, immer gleich für dieselbe Inserat-Nummer (FNV-1a). */
export function uebergabeCode(id: string): string {
  let h = 0x811c9dc5;
  for (const zeichen of id) {
    h ^= zeichen.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return String(h % 1_000_000).padStart(6, "0");
}

export const qrText = (i: Pick<Inserat, "id" | "code">) => `reroom://uebergabe/${i.id}/${i.code}`;

export function liesQr(text: string): { id: string; code: string } | undefined {
  const treffer = /^reroom:\/\/uebergabe\/([^/\s]+)\/(\d{6})$/.exec(text.trim());
  return treffer ? { id: treffer[1]!, code: treffer[2]! } : undefined;
}

/** Stimmt der gescannte Code mit dem Inserat überein, und wartet es auf die Übergabe? */
export function uebergabeGueltig(i: Inserat, gescannt: string): boolean {
  const q = liesQr(gescannt);
  return Boolean(q) && q!.id === i.id && q!.code === i.code && i.status === "verkauft";
}

// ---------- Erstellen ----------

export function neuesInserat(e: Entwurf, id: string, jetzt: Date): Inserat | undefined {
  const m = masse(e);
  const preis = euroAusText(e.preis);
  if (!m || !preis || !e.kategorie || !e.farbe || !e.zustand) return undefined;
  return {
    id, titel: e.titel.trim(), kategorie: e.kategorie, farbe: e.farbe, zustand: e.zustand, masseCm: m,
    neupreis: euroAusText(e.neupreis) ?? 0, preis, fotos: e.fotos, hervorgehoben: e.hervorgehoben, abholung: e.abholung,
    status: "online", code: uebergabeCode(id), erstelltAm: jetzt.toISOString(),
  };
}

/** So sieht ein Inserat für Käufer aus: wie ein gebrauchtes Möbel im Katalog. */
export function inseratZuMoebel(i: Inserat): Moebel {
  return {
    id: i.id, name: i.titel, kategorie: i.kategorie, zustand: "gebraucht", preis: i.preis,
    anbieter: "Privat, Chemnitz (dein Inserat)", entfernungKm: 1, masseCm: i.masseCm, stile: [], farben: [i.farbe],
    beschreibung: `${i.zustand}. ${i.abholung === "abholung" ? "Abholung beim Verkäufer." : "Transport buchbar."}`,
    bildUrl: i.fotos[0], hervorgehoben: i.hervorgehoben,
  };
}

export const STATUS_TEXT: Record<Status, string> = { online: "Online", verkauft: "Bezahlt, wartet auf Übergabe", uebergeben: "Übergeben" };
