import { describe, expect, it } from "vitest";
import type { Moebel, Raum } from "../models/types";
import katalogJson from "../data/moebel.json";
import { BEISPIELRAEUME } from "../data/raeume";
import { einrichten, type Platzierung } from "./einrichten";
import { ausrichtung, rundgangBlickwinkel, rundgangPunkt } from "./ausrichtung";

const katalog = katalogJson as Moebel[];
const wohn = BEISPIELRAEUME[2] as Raum; // 400 × 500 cm
const sofa = katalog.find((m) => m.id === "sofa-01")!;
const platz = (x: number, y: number, w: number, h: number): Platzierung => ({ moebel: sofa, x, y, w, h });

describe("Ausrichtung im 3D-Raum", () => {
  it("Sofa an der hinteren Wand schaut in den Raum", () => {
    const a = ausrichtung(platz(100, 5, 200, 85), wohn);
    expect(a.drehungRad).toBe(0);
    expect(a.breiteCm).toBe(200);
    expect(a.tiefeCm).toBe(85);
  });

  it("Mitte in Metern", () => {
    const a = ausrichtung(platz(100, 5, 200, 85), wohn);
    expect(a.mitteXm).toBeCloseTo(2, 5);
    expect(a.mitteZm).toBeCloseTo(0.475, 5);
  });

  it("Möbel an der linken Wand schaut nach rechts, Maße tauschen", () => {
    const a = ausrichtung(platz(5, 150, 85, 200), wohn); // gedreht platziert: schmal in x
    expect(a.drehungRad).toBeCloseTo(Math.PI / 2, 5);
    expect(a.breiteCm).toBe(200);
    expect(a.tiefeCm).toBe(85);
  });

  it("Möbel an der rechten Wand schaut nach links", () => {
    expect(ausrichtung(platz(310, 150, 85, 200), wohn).drehungRad).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("Möbel an der vorderen Wand schaut nach hinten", () => {
    expect(ausrichtung(platz(100, 410, 200, 85), wohn).drehungRad).toBeCloseTo(Math.PI, 5);
  });

  it("bei gleichem Abstand zählt die hintere Wand zuerst", () => {
    expect(ausrichtung(platz(5, 5, 50, 50), wohn).drehungRad).toBe(0);
  });

  it("Möbel mitten im Raum schaut weg von der nächsten Wand", () => {
    expect(ausrichtung(platz(150, 100, 80, 80), wohn).drehungRad).toBe(0);
  });

  it("alle automatisch platzierten Möbel liegen mit ihrer Ausrichtung im Raum", () => {
    const set = ["sofa-01", "teppich-01", "tisch-03", "regal-02", "lampe-01"].map((id) => katalog.find((m) => m.id === id)!);
    for (const p of einrichten(wohn, set).platziert) {
      const a = ausrichtung(p, wohn);
      expect(a.mitteXm).toBeGreaterThan(0);
      expect(a.mitteXm).toBeLessThan(wohn.breiteCm / 100);
      expect(a.mitteZm).toBeGreaterThan(0);
      expect(a.mitteZm).toBeLessThan(wohn.tiefeCm / 100);
      expect(a.breiteCm * a.tiefeCm).toBe(p.w * p.h);
    }
  });
});

describe("Rundgang-Bahn", () => {
  it("bleibt immer im Raum, mit Abstand zur Wand", () => {
    for (let i = 0; i <= 20; i++) {
      const p = rundgangPunkt(wohn, i / 20);
      expect(p.x).toBeGreaterThan(0.4);
      expect(p.x).toBeLessThan(wohn.breiteCm / 100 - 0.4);
      expect(p.z).toBeGreaterThan(0.4);
      expect(p.z).toBeLessThan(wohn.tiefeCm / 100 - 0.4);
    }
  });

  it("beginnt vorn an der Tür-Seite und ist nach einer Runde wieder dort", () => {
    const a = rundgangPunkt(wohn, 0), b = rundgangPunkt(wohn, 1);
    expect(a.z).toBeGreaterThan(wohn.tiefeCm / 200);
    expect(a.x).toBeCloseTo(b.x, 5);
    expect(a.z).toBeCloseTo(b.z, 5);
  });

  it("Blickwinkel: im Querformat normal, im Hochformat weiter, aber höchstens 100 Grad", () => {
    expect(rundgangBlickwinkel(1.6)).toBe(68);
    const handy = rundgangBlickwinkel(390 / 844);
    expect(handy).toBeGreaterThan(68);
    expect(handy).toBeLessThanOrEqual(100);
    expect(rundgangBlickwinkel(0.1)).toBe(100);
  });

  it("auch in einem sehr kleinen Raum bricht nichts", () => {
    const klein: Raum = { ...wohn, breiteCm: 120, tiefeCm: 120 };
    const p = rundgangPunkt(klein, 0.3);
    expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
  });
});
