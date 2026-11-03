import type { Masse, Raum } from "../models/types";

export type Ampel = "gruen" | "gelb" | "rot";

export interface PasstErgebnis {
  ampel: Ampel;
  /** Kleinster Spielraum in cm (negativ = passt nicht) */
  spielraumCm: number;
  begruendung: string;
}

interface Pruefung {
  spielraumCm: number;
  text: string;
}

export function ampelFuer(spielraumCm: number): Ampel {
  if (spielraumCm > 10) return "gruen";
  if (spielraumCm >= 5) return "gelb";
  return "rot";
}

function sortiert(m: Masse): [number, number, number] {
  return [m.breite, m.tiefe, m.hoehe].sort((a, b) => a - b) as [number, number, number];
}

/** Tür: Möbel darf gekippt werden, die zwei kleinsten Maße müssen durch Breite und Höhe der Tür. */
function pruefeTuer(m: Masse, raum: Raum): Pruefung {
  const [a, b] = sortiert(m);
  const [tuerKlein, tuerGross] = [raum.tuerBreiteCm, raum.tuerHoeheCm].sort((x, y) => x - y);
  const spielraumCm = Math.min(tuerKlein - a, tuerGross - b);
  return {
    spielraumCm,
    text:
      spielraumCm < 0
        ? `Passt nicht durch die Tür: kleinste Möbelmaße ${a} × ${b} cm, Tür nur ${raum.tuerBreiteCm} × ${raum.tuerHoeheCm} cm.`
        : spielraumCm < 5
          ? `Zu knapp durch die Tür: nur ${spielraumCm} cm Spielraum.`
          : `Tür: ${spielraumCm} cm Spielraum.`,
  };
}

/** Treppenhaus: das zweitkleinste Maß muss durch die Breite passen. */
function pruefeTreppenhaus(m: Masse, raum: Raum): Pruefung {
  const [, b] = sortiert(m);
  const spielraumCm = raum.treppenhausBreiteCm - b;
  return {
    spielraumCm,
    text:
      spielraumCm < 0
        ? `Passt nicht durchs Treppenhaus: ${b} cm Breite, Treppenhaus nur ${raum.treppenhausBreiteCm} cm.`
        : spielraumCm < 5
          ? `Zu knapp fürs Treppenhaus: nur ${spielraumCm} cm Spielraum.`
          : `Treppenhaus: ${spielraumCm} cm Spielraum.`,
  };
}

/** Raum: Grundfläche darf um 90° gedreht werden, Höhe muss unter die Decke passen. */
function pruefeRaum(m: Masse, raum: Raum): Pruefung {
  const normal = Math.min(raum.breiteCm - m.breite, raum.tiefeCm - m.tiefe);
  const gedreht = Math.min(raum.breiteCm - m.tiefe, raum.tiefeCm - m.breite);
  const hoehe = raum.hoeheCm - m.hoehe;
  const spielraumCm = Math.min(Math.max(normal, gedreht), hoehe);
  let text = spielraumCm < 5 ? `Zu knapp im Raum: nur ${spielraumCm} cm Spielraum.` : `Raum: ${spielraumCm} cm Spielraum.`;
  if (spielraumCm < 0) {
    text =
      hoehe < 0
        ? `Passt nicht in den Raum: ${m.hoehe} cm hoch, Raum nur ${raum.hoeheCm} cm hoch.`
        : `Passt nicht in den Raum: ${m.breite} × ${m.tiefe} cm Grundfläche, Raum ${raum.breiteCm} × ${raum.tiefeCm} cm.`;
  }
  return { spielraumCm, text };
}

/** Ampel nach dem kleinsten Spielraum aus Tür, Treppenhaus und Raum, immer mit Begründung. */
export function pruefePasst(m: Masse, raum: Raum): PasstErgebnis {
  const pruefungen = [pruefeTuer(m, raum), pruefeTreppenhaus(m, raum), pruefeRaum(m, raum)];
  const knappste = pruefungen.reduce((x, y) => (y.spielraumCm < x.spielraumCm ? y : x));
  const ampel = ampelFuer(knappste.spielraumCm);
  const hinweis = ampel === "gelb" ? " Bitte nachmessen." : "";
  const begruendung =
    ampel === "gruen" ? "Tür, Treppenhaus und Raum haben genug Platz." : knappste.text + hinweis;
  return { ampel, spielraumCm: knappste.spielraumCm, begruendung };
}
