import { describe, expect, it } from "vitest";
import { abstandCm, bodenAbstandCm, hoeheCm, raumAusEcken } from "./arMessung";

describe("AR-Messung", () => {
  it("misst eine Türbreite von 85 cm", () => {
    expect(abstandCm({ x: 0, y: 0, z: 0 }, { x: 0.85, y: 0, z: 0 })).toBe(85);
  });

  it("misst schräge Strecken im Raum", () => {
    expect(abstandCm({ x: 0, y: 0, z: 0 }, { x: 0.3, y: 0.4, z: 0 })).toBe(50);
  });

  it("ignoriert Höhenunterschiede am Boden", () => {
    expect(bodenAbstandCm({ x: 0, y: 0, z: 0 }, { x: 3, y: 0.05, z: 4 })).toBe(500);
  });

  it("misst die Raumhöhe als reinen Höhenunterschied", () => {
    expect(hoeheCm({ x: 0, y: -1.4, z: 0 }, { x: 0.2, y: 1.1, z: 0.1 })).toBe(250);
  });

  it("berechnet Breite und Tiefe aus vier Ecken (WG-Zimmer 3 × 4 m)", () => {
    const ecken = [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 0, z: 4 },
      { x: 0, y: 0, z: 4 },
    ];
    expect(raumAusEcken(ecken)).toEqual({ breiteCm: 300, tiefeCm: 400 });
  });

  it("gleicht ungenaues Antippen aus", () => {
    const ecken = [
      { x: 0, y: 0, z: 0 },
      { x: 3.02, y: 0, z: 0 },
      { x: 3, y: 0, z: 4 },
      { x: -0.02, y: 0, z: 4.01 },
    ];
    const r = raumAusEcken(ecken)!;
    expect(r.breiteCm).toBeGreaterThanOrEqual(301);
    expect(r.breiteCm).toBeLessThanOrEqual(303);
    expect(r.tiefeCm).toBeGreaterThanOrEqual(400);
    expect(r.tiefeCm).toBeLessThanOrEqual(401);
  });

  it("braucht genau vier Ecken", () => {
    expect(raumAusEcken([{ x: 0, y: 0, z: 0 }])).toBeUndefined();
  });
});
