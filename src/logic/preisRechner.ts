import type { Moebel } from "../models/types";

// Beträge werden als ganze Cent gerechnet (kein Gleitkomma-Fehler).
export const alsCent = (euro: number): number => Math.round(euro * 100);

/** Cashback in Cent. Normal 4 %, in der Start-Aktion 6 % (siehe aktion.ts). */
export function cashbackCent(preisCent: number, prozent = 4): number {
  return Math.round((preisCent * prozent) / 100);
}

export function kaeuferschutzCent(preisCent: number): number {
  return Math.round((preisCent * 4) / 100) + 50;
}

export interface Warenkorb {
  zwischensummeCent: number;
  kaeuferschutzCent: number;
  cashbackCent: number;
  /** Zwischensumme + Käuferschutz; Cashback wird danach zurückerstattet */
  endpreisCent: number;
}

/** Neu: 4 % Cashback. Gebraucht: Käuferschutz 4 % + 0,50 €. */
export function berechneWarenkorb(positionen: Moebel[], cashbackProzent = 4): Warenkorb {
  let zwischensumme = 0;
  let schutz = 0;
  let cashback = 0;
  for (const m of positionen) {
    const cent = alsCent(m.preis);
    zwischensumme += cent;
    if (m.zustand === "neu") cashback += cashbackCent(cent, cashbackProzent);
    else schutz += kaeuferschutzCent(cent);
  }
  return {
    zwischensummeCent: zwischensumme,
    kaeuferschutzCent: schutz,
    cashbackCent: cashback,
    endpreisCent: zwischensumme + schutz,
  };
}

export const euro = (cent: number): string =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cent / 100);

/** Guthaben vom Endpreis abziehen: höchstens so viel, wie der Endpreis hoch ist. */
export function mitGuthaben(endpreisCent: number, guthabenCent: number): { abzugCent: number; zuZahlenCent: number } {
  const abzugCent = Math.max(0, Math.min(endpreisCent, guthabenCent));
  return { abzugCent, zuZahlenCent: endpreisCent - abzugCent };
}

/** Transport-Partner aus Chemnitz: ab 40 € je gebuchtem Möbel (Businessplan). */
export const TRANSPORT_CENT = 4000;

export function transportKostenCent(anzahl: number): number {
  return Math.max(0, anzahl) * TRANSPORT_CENT;
}
