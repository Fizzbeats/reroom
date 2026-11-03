// Lokaler Chatbot (Stufe 1): versteht Möbelart, Farbe, Stil, Preis, Zustand, Entfernung und Nische
// aus einem freien Satz und schlägt nur Möbel vor, die in den Raum passen.
// Dieselbe Schnittstelle kann später von der Claude-API über eine Cloud-Funktion bedient werden.

import type { Kategorie, Moebel, Raum, Stil, Zustand } from "../models/types";
import { alsCent, cashbackCent, euro, kaeuferschutzCent } from "./preisRechner";
import { liesCm } from "./messSchritte";
import { pruefeMoebel } from "./passtCheck";
import { bewerte } from "./stilFinder";

export interface Kriterien {
  kategorie?: Kategorie;
  farben: string[];
  stile: Stil[];
  maxPreis?: number;
  zustand?: Zustand;
  maxKm?: number;
  nischeBreiteCm?: number;
  guenstig?: boolean;
}

export type Rueckfrage = "nische";

export interface ChatAntwort {
  text: string;
  treffer: Moebel[];
  kriterien?: Kriterien;
  rueckfrage?: Rueckfrage;
}

/** Was der Chatbot aus der vorigen Antwort mitnimmt, z. B. wenn er nach der Nischenbreite gefragt hat. */
export interface Kontext {
  kriterien?: Kriterien;
  rueckfrage?: Rueckfrage;
}

export const MAX_TREFFER = 3;

const leer = (): Kriterien => ({ farben: [], stile: [] });
const normal = (s: string) => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

// ---------- Verstehen ----------

const KATEGORIE_NAMEN: Record<Kategorie, string> = {
  sofa: "Sofa", bett: "Bett", schrank: "Schrank", tisch: "Tisch", stuhl: "Stuhl", regal: "Regal", lampe: "Lampe", teppich: "Teppich",
};

/** Ein Wort zur Möbelart. Zusammengesetzte Wörter wie „Tischlampe“ zählen als Lampe, nicht als Tisch. */
function kategorieAusWort(w: string): Kategorie | undefined {
  if (/lampe|leuchte/.test(w)) return "lampe";
  if (/teppich|kelim/.test(w)) return "teppich";
  if (/regal/.test(w)) return "regal";
  if (/schrank|kommode|sideboard/.test(w)) return "schrank";
  if (/sofa|couch(?!tisch)/.test(w)) return "sofa";
  if (/bett|matratze/.test(w)) return "bett";
  if (/stuhl|stuehle|sessel|hocker/.test(w)) return "stuhl";
  if (/tisch/.test(w)) return "tisch";
  return undefined;
}

const FARBEN: [string, RegExp][] = [
  ["grau", /grau/], ["weiss", /weiss/], ["holz", /holz|eiche|birke|ahorn|natur/], ["schwarz", /schwarz/],
  ["braun", /braun|leder/], ["terrakotta", /terrakotta|rostrot|orange|\brot\b/],
];

const STILE: [Stil, RegExp][] = [
  ["skandi", /skandi/], ["modern", /modern/], ["industrial", /industrial|industrie|loft/], ["boho", /boho|bohemian/], ["vintage", /vintage|retro/],
];

const ZAHL = String.raw`(\d+(?:[.,]\d+)?)(?![\d.,])(?!\s*(?:km|cm|zentimeter|m\b|meter))`;
const PREIS_MIT_WORT = new RegExp(String.raw`(?:unter|bis(?:\s+zu)?|maximal|max\.?|hoechstens|weniger\s+als|fuer|budget(?:\s+von)?)\s*${ZAHL}`);
const PREIS_MIT_EURO = new RegExp(String.raw`${ZAHL}\s*(?:€|euro|eur)`);

function zahl(s: string): number {
  return Number(s.replace(",", "."));
}

/**
 * Liest die Nischenbreite: „Nische 140 cm“, „140 cm Nische“, „1,4 m“.
 * Nach einer Rückfrage reicht auch nur „140“. Sonst braucht die Zahl eine Einheit,
 * damit ein Preis wie „400 €“ nicht als Breite gelesen wird.
 */
function nischenBreite(t: string, nachRueckfrage: boolean): number | undefined {
  if (!nachRueckfrage && !/nische/.test(t)) return undefined;
  const treffer = nachRueckfrage
    ? /(\d+(?:[.,]\d+)?)\s*(cm|zentimeter|meter|m)?(?![a-z0-9])/.exec(t)
    : /(\d+(?:[.,]\d+)?)\s*(cm|zentimeter|meter|m)(?![a-z0-9])/.exec(t);
  if (!treffer) return undefined;
  const einheit = treffer[2] === undefined ? "" : treffer[2] === "meter" || treffer[2] === "m" ? " m" : " cm";
  const cm = liesCm(`${treffer[1]}${einheit}`)?.cm;
  return cm !== undefined && cm >= 30 && cm <= 600 ? cm : undefined;
}

/** Liest die Wünsche aus einem Satz. */
export function verstehe(frage: string, vorher: Kontext = {}): Kriterien {
  const t = normal(frage);
  const woerter = t.split(/[^a-z0-9]+/).filter(Boolean);
  const k: Kriterien = vorher.rueckfrage && vorher.kriterien ? { ...vorher.kriterien, farben: [...vorher.kriterien.farben], stile: [...vorher.kriterien.stile] } : leer();

  // Bei einer Rückfrage („Wie breit ist die Nische?“) zählt nur die Zahl der Antwort
  if (vorher.rueckfrage === "nische") {
    const breite = nischenBreite(t, true);
    if (breite !== undefined) k.nischeBreiteCm = breite;
    return k;
  }

  for (const w of woerter) {
    const kat = kategorieAusWort(w);
    if (kat) { k.kategorie = kat; break; }
  }
  for (const [name, re] of FARBEN) if (re.test(t) && !k.farben.includes(name)) k.farben.push(name);
  for (const [name, re] of STILE) if (re.test(t) && !k.stile.includes(name)) k.stile.push(name);

  const preis = PREIS_MIT_WORT.exec(t) ?? PREIS_MIT_EURO.exec(t);
  if (preis) k.maxPreis = zahl(preis[1]!);

  const km = /(?:unter|bis|max\.?|innerhalb(?:\s+von)?)\s*(\d+)\s*km/.exec(t);
  if (km) { k.maxKm = Number(km[1]); k.zustand = "gebraucht"; }
  const gebraucht = /gebraucht|second\s*hand|secondhand|nachbarschaft|privat/.test(t);
  const neu = /\bneu(?:e|en|er|es)?\b/.test(t);
  if (gebraucht && !neu) k.zustand = "gebraucht";
  else if (neu && !gebraucht) k.zustand = "neu";

  if (/guenstig|billig|preiswert/.test(t)) k.guenstig = true;

  const breite = nischenBreite(t, false);
  if (breite !== undefined) k.nischeBreiteCm = breite;
  return k;
}

function hatNische(frage: string) {
  return /nische/.test(normal(frage));
}

// ---------- Suchen ----------

export function suche(katalog: Moebel[], k: Kriterien, raum?: Raum): Moebel[] {
  const wunsch = { budget: k.maxPreis ?? Infinity, stile: k.stile, farben: k.farben };
  return katalog
    .filter((m) => !k.kategorie || m.kategorie === k.kategorie)
    .filter((m) => k.maxPreis === undefined || m.preis <= k.maxPreis)
    .filter((m) => k.farben.length === 0 || m.farben.some((f) => k.farben.includes(f)))
    .filter((m) => k.stile.length === 0 || m.stile.some((s) => k.stile.includes(s)))
    .filter((m) => !k.zustand || m.zustand === k.zustand)
    .filter((m) => k.maxKm === undefined || (m.entfernungKm !== undefined && m.entfernungKm <= k.maxKm))
    .filter((m) => k.nischeBreiteCm === undefined || m.masseCm.breite + 2 <= k.nischeBreiteCm) // 2 cm Luft
    .filter((m) => !raum || pruefeMoebel(m, raum).ampel !== "rot")
    .map((m) => ({ m, punkte: bewerte(m, wunsch) }))
    .sort((a, b) => (k.guenstig ? a.m.preis - b.m.preis : b.punkte - a.punkte || a.m.preis - b.m.preis))
    .map((x) => x.m);
}

const STIL_NAMEN: Record<Stil, string> = { skandi: "Skandi", modern: "Modern", industrial: "Industrial", boho: "Boho", vintage: "Vintage" };

export function zusammenfassung(k: Kriterien): string {
  const teile: string[] = [];
  if (k.kategorie) teile.push(KATEGORIE_NAMEN[k.kategorie]);
  teile.push(...k.farben, ...k.stile.map((s) => STIL_NAMEN[s]));
  if (k.zustand) teile.push(k.zustand);
  if (k.maxPreis !== undefined) teile.push(`bis ${euro(alsCent(k.maxPreis))}`);
  if (k.maxKm !== undefined) teile.push(`bis ${k.maxKm} km`);
  if (k.nischeBreiteCm !== undefined) teile.push(`Nische ${k.nischeBreiteCm} cm`);
  return teile.join(" · ");
}

const keineKriterien = (k: Kriterien) =>
  !k.kategorie && k.farben.length === 0 && k.stile.length === 0 && k.maxPreis === undefined && !k.zustand && k.maxKm === undefined && k.nischeBreiteCm === undefined;

/** Lockert Wünsche der Reihe nach, wenn nichts gefunden wird. Die Nische bleibt immer bestehen. */
const LOCKERUNGEN: { name: string; ohne: (k: Kriterien) => Kriterien; war: (k: Kriterien) => boolean }[] = [
  { name: "das Preislimit", ohne: (k) => ({ ...k, maxPreis: undefined }), war: (k) => k.maxPreis !== undefined },
  { name: "die Farbe", ohne: (k) => ({ ...k, farben: [] }), war: (k) => k.farben.length > 0 },
  { name: "den Stil", ohne: (k) => ({ ...k, stile: [] }), war: (k) => k.stile.length > 0 },
  { name: "die Entfernung", ohne: (k) => ({ ...k, maxKm: undefined }), war: (k) => k.maxKm !== undefined },
  { name: "neu oder gebraucht", ohne: (k) => ({ ...k, zustand: undefined, maxKm: undefined }), war: (k) => k.zustand !== undefined },
];

// ---------- Antworten ----------

const HILFE_BEISPIELE = "„Graues Sofa unter 400 €, das in meine Nische passt“, „Skandi-Regal unter 100 €“ oder „Passt das Sofa Lund durch meine Tür?“";

function findeMoebelImText(frage: string, katalog: Moebel[]): Moebel | undefined {
  const t = normal(frage);
  return katalog.find((m) => t.includes(normal(m.name)));
}

function raumHinweis(raum?: Raum): string {
  return raum
    ? `Alle passen in dein ${raum.name}, auch durch Tür und Treppenhaus.`
    : "Miss deinen Raum oder wähle einen Beispielraum, dann prüfe ich auch Tür und Treppenhaus.";
}

/** Beantwortet eine Frage. `vorher` ist der Stand aus der letzten Antwort (für Rückfragen). */
export function antworte(frage: string, katalog: Moebel[], raum?: Raum, vorher: Kontext = {}): ChatAntwort {
  const t = normal(frage).trim();

  if (vorher.rueckfrage === "nische") {
    const k = verstehe(frage, vorher);
    if (k.nischeBreiteCm === undefined) {
      return { text: "Das habe ich nicht als Maß verstanden. Wie breit ist deine Nische? Zum Beispiel „140 cm“.", treffer: [], kriterien: k, rueckfrage: "nische" };
    }
    return ergebnis(k, katalog, raum);
  }

  if (t === "") return { text: `Frag mich zum Beispiel ${HILFE_BEISPIELE}.`, treffer: [] };
  if (/^(hallo|hi|hey|moin|servus|guten (tag|morgen|abend))\b/.test(t)) {
    return { text: `Hallo! Ich suche Möbel, die zu Raum, Stil und Budget passen. Frag mich zum Beispiel ${HILFE_BEISPIELE}.`, treffer: [] };
  }
  if (/\bdanke\b|dankeschoen/.test(t)) return { text: "Gern! Sag Bescheid, wenn ich noch etwas suchen soll.", treffer: [] };
  if (/hilfe|was kannst du|wie funktionierst du/.test(t)) {
    return { text: `Ich kenne die Maße deines Raums und schlage nur Möbel vor, die durch Tür und Treppenhaus in den Raum passen. Frag mich zum Beispiel ${HILFE_BEISPIELE}.`, treffer: [] };
  }
  if (/cashback|zurueck ?bekomm|rueckerstatt/.test(t)) {
    return { text: `Bei neuen Möbeln bekommst du 4 % vom Kaufpreis zurück, zum Beispiel ${euro(cashbackCent(alsCent(649)))} bei einem Sofa für 649 €.`, treffer: [] };
  }
  if (/kaeuferschutz|käuferschutz/.test(t)) {
    return { text: `Bei gebrauchten Möbeln zahlst du 4 % plus 0,50 € Käuferschutz, zum Beispiel ${euro(kaeuferschutzCent(alsCent(180)))} bei einem Sofa für 180 €.`, treffer: [] };
  }

  // Frage zu einem bestimmten Möbel: „Passt das Sofa Lund durch meine Tür?“
  const genannt = findeMoebelImText(frage, katalog);
  if (genannt) {
    if (!raum) {
      return { text: `${genannt.name} ist ${genannt.masseCm.breite} × ${genannt.masseCm.tiefe} × ${genannt.masseCm.hoehe} cm groß. Miss deinen Raum, dann sage ich dir, ob es passt.`, treffer: [genannt] };
    }
    const p = pruefeMoebel(genannt, raum);
    const wort = { gruen: "Passt", gelb: "Knapp", rot: "Passt nicht" }[p.ampel];
    return { text: `${genannt.name} im ${raum.name}: ${wort}. ${p.begruendung}`, treffer: [genannt] };
  }

  const k = verstehe(frage);
  if (keineKriterien(k)) {
    return { text: `Dazu brauche ich etwas mehr. Was suchst du? Zum Beispiel ${HILFE_BEISPIELE}.`, treffer: [] };
  }
  if (hatNische(frage) && k.nischeBreiteCm === undefined) {
    return { text: "Wie breit ist deine Nische? Miss von Wand zu Wand, zum Beispiel „140 cm“.", treffer: [], kriterien: k, rueckfrage: "nische" };
  }
  return ergebnis(k, katalog, raum);
}

function ergebnis(k: Kriterien, katalog: Moebel[], raum?: Raum): ChatAntwort {
  const alle = suche(katalog, k, raum);
  if (alle.length > 0) {
    const n = alle.length;
    const text = `${n === 1 ? "1 Treffer" : `${n} Treffer`} für ${zusammenfassung(k)}. ${raumHinweis(raum)}${n > MAX_TREFFER ? " Das sind die besten drei:" : ""}`;
    return { text, treffer: alle.slice(0, MAX_TREFFER), kriterien: k };
  }

  for (const lockerung of LOCKERUNGEN) {
    if (!lockerung.war(k)) continue;
    const lockerer = lockerung.ohne(k);
    const gefunden = suche(katalog, lockerer, raum);
    if (gefunden.length > 0) {
      return {
        text: `Für ${zusammenfassung(k)} finde ich nichts. Ohne ${lockerung.name} gibt es ${gefunden.length === 1 ? "einen Treffer" : `${gefunden.length} Treffer`}:`,
        treffer: gefunden.slice(0, MAX_TREFFER),
        kriterien: lockerer,
      };
    }
  }

  const grund = k.nischeBreiteCm !== undefined ? "Dazu finde ich nichts, das in deine Nische passt." : "Dazu finde ich nichts.";
  return { text: `${grund} Versuch es mit weniger Vorgaben oder einer anderen Möbelart.`, treffer: [], kriterien: k };
}
