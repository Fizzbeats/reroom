import { describe, expect, it } from "vitest";
import { ALLE_FARBEN, ALLE_STILE } from "../models/types";
import { LokalesMoebelRepository } from "./moebelRepository";
import { BEISPIELRAEUME } from "./raeume";

const katalog = await new LokalesMoebelRepository().alle();

describe("Möbelkatalog", () => {
  it("hat etwa 30 Möbel mit eindeutiger ID", () => {
    expect(katalog.length).toBe(30);
    expect(new Set(katalog.map((k) => k.id)).size).toBe(30);
  });

  it("mischt neu und gebraucht", () => {
    expect(katalog.some((k) => k.zustand === "neu")).toBe(true);
    expect(katalog.some((k) => k.zustand === "gebraucht")).toBe(true);
  });

  it("Entfernung und Privat-Anbieter nur bei gebrauchten Möbeln", () => {
    for (const k of katalog) {
      if (k.zustand === "gebraucht") {
        expect(k.entfernungKm).toBeTypeOf("number");
        expect(k.anbieter.startsWith("Privat, Chemnitz-")).toBe(true);
      } else {
        expect(k.entfernungKm).toBeUndefined();
      }
    }
  });

  it("nutzt nur bekannte Stile und Farben und hat sinnvolle Maße", () => {
    for (const k of katalog) {
      expect(k.stile.length).toBeGreaterThan(0);
      for (const s of k.stile) expect(ALLE_STILE).toContain(s);
      for (const f of k.farben) expect(ALLE_FARBEN).toContain(f);
      expect(k.preis).toBeGreaterThan(0);
      expect(Math.min(k.masseCm.breite, k.masseCm.tiefe, k.masseCm.hoehe)).toBeGreaterThan(0);
    }
  });
});

describe("Beispielräume", () => {
  it("entsprechen dem Konzept", () => {
    expect(BEISPIELRAEUME.map((r) => r.name)).toEqual(["WG-Zimmer", "1-Zimmer-Wohnung", "Wohnzimmer"]);
    expect(BEISPIELRAEUME.every((r) => r.hoeheCm === 250)).toBe(true);
    expect(BEISPIELRAEUME[0]).toMatchObject({ breiteCm: 300, tiefeCm: 400, tuerBreiteCm: 80, tuerHoeheCm: 200, treppenhausBreiteCm: 100 });
  });
});
