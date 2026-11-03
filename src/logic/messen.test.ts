import { describe, expect, it } from "vitest";
import { abstandPx, messHinweis, messeCm, REFERENZEN, skalierung } from "./messen";

describe("Messen mit Referenzobjekt", () => {
  it("berechnet den Abstand zweier Punkte", () => {
    expect(abstandPx({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("Bankkarte ist 100 px breit: 0,0856 cm pro Bildpunkt", () => {
    const s = skalierung(8.56, { x: 10, y: 10 }, { x: 110, y: 10 });
    expect(s).toBeCloseTo(0.0856, 5);
  });

  it("misst eine Tür aus dem Foto (Karte 100 px, Tür 1000 px hoch = 85,6 cm)", () => {
    const s = skalierung(8.56, { x: 0, y: 0 }, { x: 100, y: 0 })!;
    expect(messeCm({ x: 50, y: 0 }, { x: 50, y: 1000 }, s)).toBe(86);
  });

  it("A4 lang und kurz sind richtig hinterlegt", () => {
    expect(REFERENZEN.find((r) => r.id === "a4-lang")?.laengeCm).toBe(29.7);
    expect(REFERENZEN.find((r) => r.id === "a4-kurz")?.laengeCm).toBe(21);
  });

  it("liefert keine Skalierung bei zwei gleichen Punkten", () => {
    expect(skalierung(8.56, { x: 5, y: 5 }, { x: 5, y: 5 })).toBeUndefined();
  });

  it("warnt, wenn das Referenzobjekt zu klein im Bild ist", () => {
    expect(messHinweis(50, 1000)).toContain("sehr klein");
    expect(messHinweis(200, 1000)).toBeUndefined();
  });
});
