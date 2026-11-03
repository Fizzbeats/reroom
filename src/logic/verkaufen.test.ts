import { describe, expect, it } from "vitest";
import { BEISPIELRAEUME } from "../data/raeume";
import {
  erloesCent, euroAusText, guthabenCent, inseratZuMoebel, kaeuferZahltCent, LEERER_ENTWURF, liesQr, neuesInserat,
  pruefeSchritt, qrText, transportAnteilCent, uebergabeCode, uebergabeGueltig, type Entwurf, type Inserat,
} from "./verkaufen";
import { mitGuthaben } from "./preisRechner";
import { pruefeMoebel } from "./passtCheck";

const fertig: Entwurf = {
  ...LEERER_ENTWURF, fotos: ["data:image/jpeg;base64,AAAA"], titel: "Sofa Lund", kategorie: "sofa", farbe: "grau", zustand: "Gut",
  breite: "200", tiefe: "85", hoehe: "80", neupreis: "450", preis: "180",
};
const jetzt = new Date("2026-11-04T10:00:00Z");
const inserat = (o: Partial<Inserat> = {}): Inserat => ({ ...neuesInserat(fertig, "ins-1", jetzt)!, ...o });

describe("Geld beim Verkaufen (Zahlen aus dem Businessplan)", () => {
  it("Käufer zahlt Preis plus Käuferschutz 4 % + 0,50 €", () => {
    expect(kaeuferZahltCent(180)).toBe(18000 + 770);
    expect(kaeuferZahltCent(120)).toBe(12000 + 480 + 50);
  });

  it("Verkäufer bekommt den vollen Preis, Einstellen ist kostenlos", () => {
    expect(erloesCent(180)).toBe(18000);
  });

  it("als Guthaben gibt es 5 % Bonus", () => {
    expect(guthabenCent(18000)).toBe(18900);
    expect(guthabenCent(1999)).toBe(2099); // 99,95 gerundet auf 100
    expect(guthabenCent(0)).toBe(0);
  });

  it("Transport ab 40 €, davon 15 % für ReRoom", () => {
    expect(transportAnteilCent()).toBe(600);
    expect(transportAnteilCent(6000)).toBe(900);
  });

  it("Guthaben im Warenkorb: nie mehr abziehen als der Endpreis", () => {
    expect(mitGuthaben(25000, 18900)).toEqual({ abzugCent: 18900, zuZahlenCent: 6100 });
    expect(mitGuthaben(5000, 18900)).toEqual({ abzugCent: 5000, zuZahlenCent: 0 });
    expect(mitGuthaben(5000, 0)).toEqual({ abzugCent: 0, zuZahlenCent: 5000 });
    expect(mitGuthaben(5000, -300).abzugCent).toBe(0);
  });
});

describe("Preis aus Text", () => {
  it.each([["180", 180], ["180,50", 180.5], ["180 €", 180], ["99.9", 99.9], [" 12 euro ", 12]])("%j → %f", (text, wert) => {
    expect(euroAusText(text)).toBe(wert);
  });
  it.each(["", "abc", "0", "-5", "12,345", "1 2"])("%j ist ungültig", (text) => {
    expect(euroAusText(text)).toBeUndefined();
  });
});

describe("Einstell-Assistent prüft jeden Schritt", () => {
  it("Schritt 1: mindestens ein Foto", () => {
    expect(pruefeSchritt(0, LEERER_ENTWURF)).toContain("Foto");
    expect(pruefeSchritt(0, fertig)).toBeUndefined();
  });

  it("Schritt 2: Name, Möbelart, Farbe und Zustand", () => {
    expect(pruefeSchritt(1, { ...fertig, titel: "ab" })).toContain("Namen");
    expect(pruefeSchritt(1, { ...fertig, kategorie: undefined })).toContain("was für ein Möbel");
    expect(pruefeSchritt(1, { ...fertig, farbe: undefined })).toContain("Hauptfarbe");
    expect(pruefeSchritt(1, { ...fertig, zustand: undefined })).toContain("Zustand");
    expect(pruefeSchritt(1, fertig)).toBeUndefined();
  });

  it("Schritt 3: Maße als Zahl, in einem sinnvollen Bereich", () => {
    expect(pruefeSchritt(2, { ...fertig, tiefe: "" })).toContain("Breite, Tiefe und Höhe");
    expect(pruefeSchritt(2, { ...fertig, hoehe: "abc" })).toContain("Breite, Tiefe und Höhe");
    expect(pruefeSchritt(2, { ...fertig, breite: "1000" })).toContain("zwischen");
    expect(pruefeSchritt(2, { ...fertig, breite: "2 m" })).toBeUndefined(); // 200 cm
    expect(pruefeSchritt(2, fertig)).toBeUndefined();
  });

  it("Schritt 4: Preis", () => {
    expect(pruefeSchritt(3, { ...fertig, preis: "" })).toContain("Preis");
    expect(pruefeSchritt(3, { ...fertig, preis: "99999" })).toContain("Portal");
    expect(pruefeSchritt(3, fertig)).toBeUndefined();
  });
});

describe("Inserat anlegen", () => {
  it("baut aus dem fertigen Entwurf ein Inserat im Status online", () => {
    const i = neuesInserat(fertig, "ins-1", jetzt)!;
    expect(i).toMatchObject({ titel: "Sofa Lund", kategorie: "sofa", preis: 180, neupreis: 450, status: "online", masseCm: { breite: 200, tiefe: 85, hoehe: 80 } });
    expect(i.code).toMatch(/^\d{6}$/);
  });

  it("ohne vollständige Angaben entsteht kein Inserat", () => {
    expect(neuesInserat({ ...fertig, preis: "" }, "x", jetzt)).toBeUndefined();
    expect(neuesInserat({ ...fertig, kategorie: undefined }, "x", jetzt)).toBeUndefined();
  });

  it("Käufer sehen es als gebrauchtes Möbel mit dem ersten Foto", () => {
    const m = inseratZuMoebel(inserat({ hervorgehoben: true }));
    expect(m).toMatchObject({ id: "ins-1", zustand: "gebraucht", preis: 180, kategorie: "sofa", farben: ["grau"], hervorgehoben: true });
    expect(m.bildUrl).toBe("data:image/jpeg;base64,AAAA");
    expect(m.anbieter).toContain("Chemnitz");
  });

  it("das Inserat läuft durch den Passt-Check wie jedes andere Möbel", () => {
    expect(pruefeMoebel(inseratZuMoebel(inserat()), BEISPIELRAEUME[2]!).ampel).toBe("gelb"); // 10 cm Spielraum an der Tür
  });
});

describe("Übergabe per QR-Code", () => {
  it("der Code ist sechsstellig und für dieselbe Nummer immer gleich", () => {
    expect(uebergabeCode("ins-1")).toMatch(/^\d{6}$/);
    expect(uebergabeCode("ins-1")).toBe(uebergabeCode("ins-1"));
    expect(uebergabeCode("ins-1")).not.toBe(uebergabeCode("ins-2"));
  });

  it("QR-Text lässt sich wieder lesen", () => {
    const i = inserat();
    expect(liesQr(qrText(i))).toEqual({ id: "ins-1", code: i.code });
    expect(liesQr("https://example.com")).toBeUndefined();
    expect(liesQr("reroom://uebergabe/ins-1/12")).toBeUndefined();
  });

  it("nur der richtige Code zur richtigen Zeit gilt", () => {
    const wartet = inserat({ status: "verkauft" });
    expect(uebergabeGueltig(wartet, qrText(wartet))).toBe(true);
    expect(uebergabeGueltig(wartet, qrText({ id: "ins-1", code: "000000" }))).toBe(false); // falscher Code
    expect(uebergabeGueltig(wartet, qrText({ id: "ins-2", code: wartet.code }))).toBe(false); // falsches Inserat
    expect(uebergabeGueltig(inserat({ status: "online" }), qrText(inserat()))).toBe(false); // noch nicht bezahlt
    expect(uebergabeGueltig(inserat({ status: "uebergeben" }), qrText(inserat()))).toBe(false); // schon übergeben
  });
});
