import { describe, expect, it } from "vitest";
import type { Moebel, Raum } from "../models/types";
import { BEISPIELRAEUME } from "../data/raeume";
import katalog from "../data/moebel.json";
import { einrichten, tuerBereich, ueberlappt } from "./einrichten";
import { werteAus, zimmerSet, SET_REIHENFOLGE, type InspoKarte } from "./stilAuswertung";
import { pruefeMoebel, pruefePasst } from "./passtCheck";

const alle = katalog as Moebel[];
const [wg, , wohn] = BEISPIELRAEUME as [Raum, Raum, Raum];
const holen = (id: string) => alle.find((m) => m.id === id)!;

describe("Einrichten im Grundriss", () => {
  const set = ["sofa-01", "teppich-01", "tisch-03", "regal-02", "lampe-01"].map(holen);
  const { platziert, nichtPlatziert } = einrichten(wohn, set);

  it("stellt alle Möbel ins Wohnzimmer", () => {
    expect(nichtPlatziert).toEqual([]);
    expect(platziert).toHaveLength(5);
  });

  it("alles liegt innerhalb des Raums", () => {
    for (const p of platziert) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(wohn.breiteCm);
      expect(p.y + p.h).toBeLessThanOrEqual(wohn.tiefeCm);
    }
  });

  it("Möbel überlappen sich nicht (nur Teppiche liegen darunter)", () => {
    const stehend = platziert.filter((p) => p.moebel.kategorie !== "teppich");
    for (const a of stehend) for (const b of stehend) if (a !== b) expect(ueberlappt(a, b)).toBe(false);
  });

  it("hält den Schwenkbereich der Tür frei", () => {
    for (const p of platziert.filter((p) => p.moebel.kategorie !== "teppich")) {
      expect(ueberlappt(p, tuerBereich(wohn))).toBe(false);
    }
  });

  it("stellt das Sofa an die obere Wand", () => {
    const sofa = platziert.find((p) => p.moebel.kategorie === "sofa")!;
    expect(sofa.y).toBeLessThanOrEqual(10);
  });

  it("dreht ein Möbel, wenn es nur gedreht passt", () => {
    const schmal: Raum = { ...wg, breiteCm: 150, tiefeCm: 400 };
    const bett = holen("bett-03"); // 100 × 205
    const r = einrichten(schmal, [{ ...bett, masseCm: { breite: 205, tiefe: 100, hoehe: 85 } }]);
    expect(r.platziert[0]?.w).toBe(100);
  });

  it("meldet Möbel, die gar nicht in den Raum passen", () => {
    const winzig: Raum = { ...wg, breiteCm: 120, tiefeCm: 120 };
    expect(einrichten(winzig, [holen("sofa-03")]).nichtPlatziert).toHaveLength(1);
  });
});

describe("Stil-Finder: Auswertung der Wisch-Karten", () => {
  const karten: InspoKarte[] = [
    { id: "1", stil: "skandi", farben: ["weiss", "holz"] },
    { id: "2", stil: "boho", farben: ["terrakotta", "holz"] },
    { id: "3", stil: "industrial", farben: ["schwarz", "grau"] },
    { id: "4", stil: "skandi", farben: ["grau", "holz"] },
  ];

  it("ermittelt die beliebtesten Stile und Farben", () => {
    const r = werteAus(karten, [true, true, false, true]);
    expect(r.stile).toEqual(["skandi", "boho"]);
    expect(r.farben[0]).toBe("holz");
    expect(r.nichtGemocht).toEqual(["schwarz"]);
  });

  it("liefert nichts, wenn nichts gefallen hat", () => {
    expect(werteAus(karten, [false, false, false, false]).stile).toEqual([]);
  });
});

describe("Zimmer-Set", () => {
  const wunsch = { stile: ["skandi" as const], farben: ["holz"] };

  it("bleibt im Budget und nimmt je Kategorie höchstens ein Möbel", () => {
    const set = zimmerSet(alle, wunsch, 300, wohn);
    expect(set.summe).toBeLessThanOrEqual(300);
    expect(set.summe).toBe(set.moebel.reduce((s, m) => s + m.preis, 0));
    const kategorien = set.moebel.map((m) => m.kategorie);
    expect(new Set(kategorien).size).toBe(kategorien.length);
    for (const k of kategorien) expect(SET_REIHENFOLGE).toContain(k);
  });

  it("nimmt nichts, was rot im Passt-Check ist", () => {
    for (const m of zimmerSet(alle, wunsch, 3000, wg).moebel) expect(pruefeMoebel(m, wg).ampel).not.toBe("rot");
  });

  it("lässt Möbel in ungeliebten Farben weg", () => {
    const set = zimmerSet(alle, { ...wunsch, nichtGemocht: ["grau"] }, 3000, wohn);
    expect(set.moebel.some((m) => m.farben.includes("grau"))).toBe(false);
  });

  it("bei sehr kleinem Budget bleibt das Set klein", () => {
    expect(zimmerSet(alle, wunsch, 10, wohn).moebel).toEqual([]);
  });
});

describe("Passt-Check für Teppiche", () => {
  const teppich = holen("teppich-01"); // 200 × 140 cm

  it("ein gerollter Teppich passt durchs Treppenhaus", () => {
    expect(pruefePasst(teppich.masseCm, wohn).ampel).toBe("rot"); // flach getragen zu breit
    expect(pruefeMoebel(teppich, wohn).ampel).toBe("gruen");
  });

  it("die Raumfläche zählt trotzdem", () => {
    const klein: Raum = { ...wohn, breiteCm: 130, tiefeCm: 130 };
    expect(pruefeMoebel(teppich, klein).ampel).toBe("rot");
  });

  it("andere Möbel werden normal geprüft", () => {
    const sofa = holen("sofa-01");
    expect(pruefeMoebel(sofa, wohn)).toEqual(pruefePasst(sofa.masseCm, wohn));
  });
});
