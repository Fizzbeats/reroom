import { describe, expect, it } from "vitest";
import { liesCm, MESS_SCHRITTE, pruefeEingabe } from "./messSchritte";

const schritt = (key: string) => MESS_SCHRITTE.find((s) => s.key === key)!;

describe("Eingabe lesen", () => {
  it.each([
    ["85", 85],
    ["85 cm", 85],
    ["85cm", 85],
    ["0,85 m", 85],
    ["1,2m", 120],
    ["2,5", 250], // ohne Einheit und unter 10: Meter
    ["85,5", 86],
    ["  110  ", 110],
  ])("liest %s als %i cm", (text, cm) => {
    expect(liesCm(text)?.cm).toBe(cm);
  });

  it.each(["", "abc", "85 x", "-5", "0", "8 5 5"])("lehnt %j ab", (text) => {
    expect(liesCm(text)).toBeUndefined();
  });
});

describe("Prüfung je Maß", () => {
  it("normale Türbreite ist in Ordnung", () => {
    expect(pruefeEingabe(schritt("tuerB"), "85")).toEqual({ status: "ok", cm: 85, text: undefined });
  });

  it("leere Eingabe ist leer, Text ist ungültig", () => {
    expect(pruefeEingabe(schritt("tuerB"), "").status).toBe("leer");
    expect(pruefeEingabe(schritt("tuerB"), "breit").status).toBe("ungueltig");
  });

  it("Meter werden erklärt", () => {
    const r = pruefeEingabe(schritt("hoehe"), "2,5");
    expect(r.status).toBe("ok");
    expect(r.cm).toBe(250);
    expect(r.text).toContain("250 cm");
  });

  it("ungewöhnliche Werte warnen, verbieten aber nichts", () => {
    const r = pruefeEingabe(schritt("tuerB"), "8");
    expect(r.status).toBe("warnung");
    expect(r.cm).toBe(800);
    expect(pruefeEingabe(schritt("tuerB"), "30").status).toBe("warnung");
    expect(pruefeEingabe(schritt("tuerB"), "30").cm).toBe(30);
  });

  it("alle Beispielwerte liegen im üblichen Bereich", () => {
    for (const s of MESS_SCHRITTE) expect(pruefeEingabe(s, String(s.beispiel)).status).toBe("ok");
  });

  it("die Beispielräume bestehen die Prüfung", () => {
    expect(MESS_SCHRITTE.map((s) => s.key)).toEqual(["tuerB", "tuerH", "treppe", "breite", "tiefe", "hoehe"]);
  });
});
