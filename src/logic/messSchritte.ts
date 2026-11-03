// Die sechs Maße, die ReRoom für den Passt-Check braucht, und das Lesen der Eingabe.

export type MessKey = "tuerB" | "tuerH" | "treppe" | "breite" | "tiefe" | "hoehe";

export interface MessSchritt {
  key: MessKey;
  /** Kurzer Name für Feldbeschriftungen */
  name: string;
  titel: string;
  anleitung: string;
  /** Übliche Werte in cm: außerhalb kommt ein Hinweis, kein Verbot */
  min: number;
  max: number;
  beispiel: number;
}

// Reihenfolge: zuerst die Maße, die am häufigsten entscheiden, ob etwas durchpasst
export const MESS_SCHRITTE: MessSchritt[] = [
  { key: "tuerB", name: "Türbreite", titel: "Wie breit ist deine Tür?", anleitung: "Miss von Rahmen zu Rahmen, an der schmalsten Stelle. Die Tür selbst nicht mitmessen, wenn sie in den Raum aufgeht.", min: 50, max: 200, beispiel: 85 },
  { key: "tuerH", name: "Türhöhe", titel: "Wie hoch ist die Tür?", anleitung: "Vom Boden bis zur Unterkante des Rahmens oben, innen gemessen.", min: 150, max: 260, beispiel: 205 },
  { key: "treppe", name: "Treppenhausbreite", titel: "Wie breit ist das Treppenhaus?", anleitung: "An der engsten Stelle, zwischen Wand und Geländer. Dort kommt ein Möbel am schwersten durch.", min: 60, max: 300, beispiel: 110 },
  { key: "breite", name: "Raumbreite", titel: "Wie breit ist der Raum?", anleitung: "Von Wand zu Wand, entlang der Wand mit dem Fenster.", min: 100, max: 1500, beispiel: 400 },
  { key: "tiefe", name: "Raumtiefe", titel: "Wie tief ist der Raum?", anleitung: "Von der Wand mit der Tür bis zur gegenüberliegenden Wand.", min: 100, max: 1500, beispiel: 500 },
  { key: "hoehe", name: "Raumhöhe", titel: "Wie hoch ist der Raum?", anleitung: "Vom Boden bis zur Decke.", min: 200, max: 400, beispiel: 250 },
];

export interface Eingabe {
  status: "leer" | "ungueltig" | "ok" | "warnung";
  cm?: number;
  /** Hinweis für die Anzeige, z. B. wie die Eingabe gelesen wurde */
  text?: string;
}

/**
 * Liest "85", "85 cm", "0,85 m", "1,2m" oder "2,5" als Zentimeter.
 * Ohne Einheit gelten Zahlen bis 10 als Meter (wer „2,5“ für die Raumhöhe schreibt, meint Meter).
 */
export function liesCm(text: string): { cm: number; alsMeter: boolean } | undefined {
  // Leerzeichen sind nur vor der Einheit erlaubt („85 cm“), nicht mitten in der Zahl
  const treffer = /^(\d+(?:[.,]\d+)?)\s*(cm|m)?$/.exec(text.trim().toLowerCase());
  if (!treffer) return undefined;
  const zahl = Number(treffer[1]!.replace(",", "."));
  const einheit = treffer[2];
  const alsMeter = einheit === "m" || (einheit === undefined && zahl < 10);
  const cm = Math.round(alsMeter ? zahl * 100 : zahl);
  return cm > 0 ? { cm, alsMeter } : undefined;
}

export function pruefeEingabe(schritt: MessSchritt, text: string): Eingabe {
  if (text.trim() === "") return { status: "leer" };
  const gelesen = liesCm(text);
  if (!gelesen) return { status: "ungueltig", text: "Bitte nur eine Zahl eingeben, zum Beispiel 85." };
  const { cm, alsMeter } = gelesen;
  const gelesenText = alsMeter ? `Gelesen als ${cm} cm. ` : "";
  if (cm < schritt.min || cm > schritt.max) {
    return {
      status: "warnung",
      cm,
      text: `${gelesenText}Das ist ungewöhnlich (üblich: ${schritt.min} bis ${schritt.max} cm). Prüfe, ob das stimmt.`,
    };
  }
  return { status: "ok", cm, text: gelesenText.trim() || undefined };
}
