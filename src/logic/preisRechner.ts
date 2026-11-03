import type { Moebel } from "../models/types";

// Beträge werden als ganze Cent gerechnet (kein Gleitkomma-Fehler).
export const alsCent = (euro: number): number => Math.round(euro * 100);

export function cashbackCent(preisCent: number): number {
  return Math.round((preisCent * 4) / 100);
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
export function berechneWarenkorb(positionen: Moebel[]): Warenkorb {
  let zwischensumme = 0;
  let schutz = 0;
  let cashback = 0;
  for (const m of positionen) {
    const cent = alsCent(m.preis);
    zwischensumme += cent;
    if (m.zustand === "neu") cashback += cashbackCent(cent);
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
