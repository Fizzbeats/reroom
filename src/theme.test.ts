import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FARBEN, kontrast } from "./theme";

const css = readFileSync(new URL("./styles/tokens.css", import.meta.url), "utf8");
const [hellCss, dunkelCss] = css.split("@media");

const cssName = (k: string) => "--" + k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

describe("Farben", () => {
  it("Vorgabefarben: Schwarz-Weiß mit orangem Akzent", () => {
    expect(FARBEN.hell.hintergrund).toBe("#FFFFFF");
    expect(FARBEN.hell.primaer).toBe("#111111");
    expect(FARBEN.hell.akzent).toBe("#FF5B2E");
  });

  it.each(["hell", "dunkel"] as const)("Text auf Akzent-Badges ist lesbar (%s)", (modus) => {
    expect(kontrast(FARBEN[modus].aufAkzent, FARBEN[modus].akzent)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["hell", "dunkel"] as const)("tokens.css stimmt mit theme.ts überein (%s)", (modus) => {
    const quelle = modus === "hell" ? hellCss : dunkelCss;
    for (const [name, wert] of Object.entries(FARBEN[modus])) {
      expect(quelle, `${cssName(name)} im Modus ${modus}`).toContain(`${cssName(name)}: ${wert};`);
    }
  });

  it.each(["hell", "dunkel"] as const)("Texte haben mindestens Kontrast 4,5 (%s)", (modus) => {
    const f = FARBEN[modus];
    expect(kontrast(f.text, f.hintergrund)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(f.text, f.karte)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(f.textGedaempft, f.hintergrund)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(f.aufPrimaer, f.primaer)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["hell", "dunkel"] as const)("Text auf Pastellgrün erreicht WCAG AA (%s)", (modus) => {
    const f = FARBEN[modus];
    expect(kontrast(f.aufPastell, f.pastell)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(f.aufPastell, f.pastellStark)).toBeGreaterThanOrEqual(4.5);
    expect(kontrast(f.text, f.pastell)).toBeGreaterThanOrEqual(4.5);
  });

  it("Pastellgrün ist der grüne Pastellton aus der CI (gruen-bg)", () => {
    expect(FARBEN.hell.pastell).toBe("#E3F3EA");
  });

  it("Ampelfarben sind auf der Karte erkennbar (Kontrast ab 3)", () => {
    for (const f of [FARBEN.hell, FARBEN.dunkel]) {
      for (const a of [f.ampelGruen, f.ampelGelb, f.ampelRot]) {
        expect(kontrast(a, f.karte)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("Kontrastberechnung: Schwarz auf Weiß = 21", () => {
    expect(kontrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });
});
