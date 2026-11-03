import type { Kategorie, Moebel, Raum, Stil } from "../models/types";
import { bewerte } from "./stilFinder";
import { pruefeMoebel } from "./passtCheck";

// ---------- Auswertung der Wisch-Karten ----------

export interface InspoKarte {
  id: string;
  stil: Stil;
  farben: string[];
  /** Eigenes Bild des Nutzers (data-URL) statt der gezeichneten Szene */
  bildUrl?: string;
}

export interface StilErgebnis {
  /** Höchstens zwei Stile, der beliebteste zuerst */
  stile: Stil[];
  /** Höchstens drei Lieblingsfarben */
  farben: string[];
  /** Farben, die nur auf abgelehnten Karten vorkamen */
  nichtGemocht: string[];
}

function zaehle<T>(werte: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const w of werte) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

const oben = <T,>(m: Map<T, number>, n: number) =>
  [...m.entries()].filter(([, z]) => z > 0).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);

/** Wertet aus, welche Karten gefallen haben (true) und welche nicht (false). */
export function werteAus(karten: InspoKarte[], gefallen: boolean[]): StilErgebnis {
  const ja = karten.filter((_, i) => gefallen[i]);
  const nein = karten.filter((_, i) => gefallen[i] === false);
  const jaFarben = zaehle(ja.flatMap((k) => k.farben));
  const neinFarben = zaehle(nein.flatMap((k) => k.farben));
  return {
    stile: oben(zaehle(ja.map((k) => k.stil)), 2),
    farben: oben(jaFarben, 3),
    nichtGemocht: [...neinFarben.keys()].filter((f) => !jaFarben.has(f)),
  };
}

// ---------- Zimmer-Set: ein passendes Möbel je Kategorie im Budget ----------

export const SET_REIHENFOLGE: Kategorie[] = ["sofa", "teppich", "tisch", "lampe", "regal"];

export interface ZimmerSet {
  moebel: Moebel[];
  summe: number;
}

/**
 * Wählt je Kategorie das Möbel mit den meisten Stil-Punkten, das ins Restbudget passt
 * und (wenn ein Raum bekannt ist) nicht rot im Passt-Check ist. Möbel in ungeliebten Farben fallen weg.
 */
export function zimmerSet(
  katalog: Moebel[],
  wunsch: { stile: Stil[]; farben: string[]; nichtGemocht?: string[] },
  budget: number,
  raum?: Raum,
): ZimmerSet {
  const auswahl: Moebel[] = [];
  let rest = budget;
  for (const kategorie of SET_REIHENFOLGE) {
    const beste = katalog
      .filter((m) => m.kategorie === kategorie && m.preis <= rest)
      .filter((m) => !m.farben.some((f) => wunsch.nichtGemocht?.includes(f)))
      .filter((m) => !raum || pruefeMoebel(m, raum).ampel !== "rot")
      .map((m) => ({ m, punkte: bewerte(m, { budget: rest, stile: wunsch.stile, farben: wunsch.farben }) }))
      .sort((a, b) => b.punkte - a.punkte || a.m.preis - b.m.preis)[0];
    if (beste) {
      auswahl.push(beste.m);
      rest -= beste.m.preis;
    }
  }
  return { moebel: auswahl, summe: budget - rest };
}
