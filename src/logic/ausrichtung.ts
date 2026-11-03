// Rechnet eine Platzierung aus dem Grundriss (cm, Draufsicht) in Werte für die 3D-Szene um.
// Welt: x nach rechts (Raumbreite), y nach oben, z nach vorn (Raumtiefe). Ursprung in der Ecke links hinten, Einheit Meter.

import type { Raum } from "../models/types";
import type { Platzierung } from "./einrichten";

export interface Ausrichtung {
  /** Mitte des Möbels am Boden in Metern */
  mitteXm: number;
  mitteZm: number;
  /** Drehung um die senkrechte Achse in Radiant. 0 = Vorderseite zeigt nach +z. */
  drehungRad: number;
  /** Maße in der eigenen Richtung des Möbels (Breite = x, Tiefe = z), in cm */
  breiteCm: number;
  tiefeCm: number;
}

/**
 * Ein Möbel schaut weg von der nächsten Wand: das Sofa an der hinteren Wand zeigt in den Raum.
 * Bei gleichem Abstand gilt die Reihenfolge hinten, links, rechts, vorn.
 */
export function ausrichtung(p: Platzierung, raum: Raum): Ausrichtung {
  const abstand = {
    hinten: p.y,
    links: p.x,
    rechts: raum.breiteCm - (p.x + p.w),
    vorn: raum.tiefeCm - (p.y + p.h),
  };
  let wand: keyof typeof abstand = "hinten";
  for (const kandidat of ["links", "rechts", "vorn"] as const) {
    if (abstand[kandidat] < abstand[wand]) wand = kandidat;
  }
  const drehung = { hinten: 0, vorn: Math.PI, links: Math.PI / 2, rechts: -Math.PI / 2 }[wand];
  const quer = wand === "links" || wand === "rechts";
  return {
    mitteXm: (p.x + p.w / 2) / 100,
    mitteZm: (p.y + p.h / 2) / 100,
    drehungRad: drehung,
    breiteCm: quer ? p.h : p.w,
    tiefeCm: quer ? p.w : p.h,
  };
}

/** Ein Punkt der Rundgang-Kamera auf einer Kreisbahn im Raum, Augenhöhe in Metern. */
export function rundgangPunkt(raum: Raum, fortschritt: number): { x: number; z: number; blickX: number; blickZ: number } {
  const b = raum.breiteCm / 100, t = raum.tiefeCm / 100;
  const mx = b / 2, mz = t / 2;
  // Bahn mit Abstand zu den Wänden, damit die Kamera nie durch eine Wand fährt
  const rx = Math.max(0.2, b / 2 - 0.55);
  const rz = Math.max(0.2, t / 2 - 0.55);
  const winkel = fortschritt * Math.PI * 2 + Math.PI / 2; // Start vorn in der Mitte (an der Tür)
  const x = mx + Math.cos(winkel) * rx;
  const z = mz + Math.sin(winkel) * rz;
  // Blick zur gegenüberliegenden Seite der Bahn, damit man den Raum sieht
  return { x, z, blickX: mx - Math.cos(winkel) * rx * 1.0, blickZ: mz - Math.sin(winkel) * rz * 1.0 };
}

/**
 * Vertikaler Blickwinkel für den Rundgang. Im Hochformat (Handy) ist das Bild schmal,
 * damit man seitlich genug sieht, wird der Winkel größer, aber nie über 100 Grad (sonst verzerrt es).
 */
export function rundgangBlickwinkel(seitenverhaeltnis: number): number {
  if (seitenverhaeltnis >= 1) return 68;
  const horizontal = (68 / 2) * (Math.PI / 180);
  const noetig = 2 * Math.atan(Math.tan(horizontal) / Math.max(0.2, seitenverhaeltnis)) * (180 / Math.PI);
  return Math.min(100, Math.max(68, noetig));
}
