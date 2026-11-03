import { describe, expect, it } from "vitest";
import type { Moebel, Raum } from "../models/types";
import { BEISPIELRAEUME } from "../data/raeume";
import { bewerte, findePassende } from "./stilFinder";
import { ampelFuer, pruefePasst } from "./passtCheck";
import { alsCent, berechneWarenkorb, cashbackCent, euro, kaeuferschutzCent } from "./preisRechner";
import { preisVorschlag } from "./verkaufsPreis";

const basis: Moebel = {
  id: "x", name: "X", kategorie: "sofa", zustand: "neu", preis: 100, anbieter: "Test",
  masseCm: { breite: 100, tiefe: 50, hoehe: 50 }, stile: ["skandi"], farben: ["grau"], beschreibung: "",
};
const m = (o: Partial<Moebel>): Moebel => ({ ...basis, ...o });
const [wg, , wohn] = BEISPIELRAEUME as [Raum, Raum, Raum];

describe("StilFinder", () => {
  const w = { budget: 200, stile: ["skandi" as const], farben: ["grau"] };

  it("vergibt Punkte für Stil, Farbe und nahe gebrauchte Möbel", () => {
    expect(bewerte(m({}), w)).toBe(5);
    expect(bewerte(m({ stile: ["boho"] }), w)).toBe(2);
    expect(bewerte(m({ stile: ["boho"], farben: ["holz"] }), w)).toBe(0);
    expect(bewerte(m({ zustand: "gebraucht", entfernungKm: 3, stile: ["boho"], farben: [] }), w)).toBe(1);
    expect(bewerte(m({ zustand: "gebraucht", entfernungKm: 10, stile: ["boho"], farben: [] }), w)).toBe(0);
  });

  it("entfernt Möbel über dem Budget", () => {
    const r = findePassende([m({ id: "a", preis: 201 }), m({ id: "b", preis: 200 })], w);
    expect(r.map((t) => t.moebel.id)).toEqual(["b"]);
  });

  it("sortiert nach Punkten, bei Gleichstand nach Preis", () => {
    const r = findePassende(
      [m({ id: "teuer", preis: 150 }), m({ id: "billig", preis: 50 }), m({ id: "schlecht", preis: 10, stile: ["boho"], farben: [] })],
      w,
    );
    expect(r.map((t) => t.moebel.id)).toEqual(["billig", "teuer", "schlecht"]);
  });
});

describe("PasstCheck", () => {
  it("Ampel-Grenzen", () => {
    expect(ampelFuer(11)).toBe("gruen");
    expect(ampelFuer(10)).toBe("gelb");
    expect(ampelFuer(5)).toBe("gelb");
    expect(ampelFuer(4)).toBe("rot");
    expect(ampelFuer(-3)).toBe("rot");
  });

  it("grün bei viel Platz", () => {
    const r = pruefePasst({ breite: 45, tiefe: 50, hoehe: 82 }, wohn);
    expect(r.ampel).toBe("gruen");
    expect(r.begruendung).toContain("genug Platz");
  });

  it("rot mit Begründung, wenn es nicht durch die Tür passt", () => {
    const r = pruefePasst({ breite: 200, tiefe: 92, hoehe: 100 }, wg);
    expect(r.ampel).toBe("rot");
    expect(r.begruendung).toContain("Passt nicht durch die Tür");
  });

  it("rot mit verständlicher Begründung bei 0 bis 4 cm Spielraum", () => {
    // Schrank Nord im WG-Zimmer (Treppenhaus hier breit): Tür lässt genau 0 cm Spielraum
    const r = pruefePasst({ breite: 200, tiefe: 60, hoehe: 210 }, { ...wg, treppenhausBreiteCm: 300 });
    expect(r.ampel).toBe("rot");
    expect(r.begruendung).toContain("Zu knapp durch die Tür");
  });

  it("liefert den Spielraum jeder einzelnen Prüfung (Sofa Lund im Wohnzimmer)", () => {
    const r = pruefePasst({ breite: 200, tiefe: 85, hoehe: 80 }, wohn);
    expect(r.details).toEqual({ tuerCm: 10, treppenhausCm: 35, raumCm: 170 });
  });

  it("gelb mit Hinweis bei 10 cm Spielraum", () => {
    const r = pruefePasst({ breite: 70, tiefe: 70, hoehe: 150 }, wg);
    expect(r.spielraumCm).toBe(10);
    expect(r.ampel).toBe("gelb");
    expect(r.begruendung).toContain("Bitte nachmessen");
  });

  it("darf das Möbel im Raum um 90° drehen", () => {
    const klein: Raum = { ...wohn, breiteCm: 100, tiefeCm: 300 };
    const r = pruefePasst({ breite: 250, tiefe: 60, hoehe: 40 }, { ...klein, tuerBreiteCm: 300, tuerHoeheCm: 300, treppenhausBreiteCm: 300 });
    expect(r.spielraumCm).toBe(40);
  });

  it("rot, wenn das Möbel höher als der Raum ist", () => {
    const r = pruefePasst({ breite: 50, tiefe: 50, hoehe: 260 }, { ...wohn, tuerBreiteCm: 300, tuerHoeheCm: 300, treppenhausBreiteCm: 300 });
    expect(r.ampel).toBe("rot");
    expect(r.begruendung).toContain("hoch");
  });

  it("rot, wenn das Treppenhaus zu schmal ist", () => {
    const r = pruefePasst({ breite: 60, tiefe: 110, hoehe: 110 }, { ...wohn, treppenhausBreiteCm: 100, tuerBreiteCm: 300, tuerHoeheCm: 300 });
    expect(r.begruendung).toContain("Treppenhaus");
  });
});

describe("PreisRechner", () => {
  it("rechnet in Cent ohne Rundungsfehler", () => {
    expect(alsCent(19.99)).toBe(1999);
    expect(alsCent(0.1 + 0.2)).toBe(30);
  });

  it("Cashback 4 % und Käuferschutz 4 % + 0,50 €", () => {
    expect(cashbackCent(64900)).toBe(2596);
    expect(kaeuferschutzCent(18000)).toBe(770);
  });

  it("Warenkorb weist alle Beträge getrennt aus", () => {
    const k = berechneWarenkorb([m({ preis: 649 }), m({ zustand: "gebraucht", preis: 180 })]);
    expect(k).toEqual({ zwischensummeCent: 82900, kaeuferschutzCent: 770, cashbackCent: 2596, endpreisCent: 83670 });
  });

  it("leerer Warenkorb ist 0", () => {
    expect(berechneWarenkorb([]).endpreisCent).toBe(0);
  });

  it("formatiert Euro auf Deutsch", () => {
    expect(euro(83670).replace(/\s/g, " ")).toBe("836,70 €");
  });
});

describe("Verkaufen", () => {
  it("Preisvorschlag = Neupreis × 0,4", () => {
    expect(preisVorschlag(500)).toBe(200);
    expect(preisVorschlag(0)).toBe(0);
    expect(preisVorschlag(Number.NaN)).toBe(0);
  });
});
