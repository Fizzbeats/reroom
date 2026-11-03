import { describe, expect, it } from "vitest";
import { kameraFehlerText, RAHMEN_TEXT } from "./kameraText";

describe("Hinweise zur eingebauten Kamera", () => {
  it.each([
    ["NotAllowedError", "nicht erlaubt"],
    ["SecurityError", "nicht erlaubt"],
    ["NotFoundError", "keine Kamera"],
    ["OverconstrainedError", "keine Kamera"],
    ["NotReadableError", "anderen App"],
  ])("%s → %s", (name, teil) => {
    expect(kameraFehlerText(new DOMException("x", name)).toLowerCase()).toContain(teil.toLowerCase());
  });

  it("jeder Hinweis nennt die Galerie als Ausweg", () => {
    for (const name of ["NotAllowedError", "NotFoundError", "NotReadableError", "Sonstiges"]) {
      expect(kameraFehlerText(new DOMException("x", name))).toContain("Galerie");
    }
    expect(kameraFehlerText("komisch")).toContain("Galerie");
  });

  it("ohne sichere Verbindung steht https im Hinweis", () => {
    const t = kameraFehlerText(new DOMException("x", "NotAllowedError"), false);
    expect(t).toContain("https");
    expect(t).toContain("Galerie");
  });

  it("Rahmen-Texte für Möbel, Karte und Einrichtungsbild", () => {
    expect(RAHMEN_TEXT.moebel).toContain("ganze Möbel");
    expect(RAHMEN_TEXT.karte).toContain("Karte");
    expect(RAHMEN_TEXT.bild).toContain("Einrichtungsbild");
  });
});
