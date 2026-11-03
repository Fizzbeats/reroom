import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import qrcode from "qrcode-generator";
import { liesQr, neuesInserat, qrText, LEERER_ENTWURF, uebergabeGueltig } from "./verkaufen";

// Zeichnet den QR-Code genau wie die App (Ruhezone von 4 Kästchen, schwarz auf weiß) als Pixelbild
// und liest ihn mit einem unabhängigen QR-Leser wieder aus. So ist sicher, dass ein Handy ihn lesen kann.
function alsPixel(text: string, skala = 6) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const seite = (n + 8) * skala;
  const daten = new Uint8ClampedArray(seite * seite * 4).fill(255);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!qr.isDark(y, x)) continue;
      for (let dy = 0; dy < skala; dy++) {
        for (let dx = 0; dx < skala; dx++) {
          const i = (((y + 4) * skala + dy) * seite + (x + 4) * skala + dx) * 4;
          daten[i] = daten[i + 1] = daten[i + 2] = 17;
        }
      }
    }
  }
  return { daten, seite };
}

describe("QR-Code der Übergabe", () => {
  const inserat = neuesInserat(
    { ...LEERER_ENTWURF, fotos: ["x"], titel: "Sofa Lund", kategorie: "sofa", farbe: "grau", zustand: "Gut", breite: "200", tiefe: "85", hoehe: "80", preis: "180" },
    "ins-mjx4k2a1", new Date("2026-11-04T10:00:00Z"),
  )!;

  it("ein QR-Leser liest den Text der App wieder aus", () => {
    const { daten, seite } = alsPixel(qrText(inserat));
    const gelesen = jsQR(daten, seite, seite);
    expect(gelesen?.data).toBe(qrText(inserat));
  });

  it("der gelesene Text besteht die Prüfung der Übergabe", () => {
    const { daten, seite } = alsPixel(qrText(inserat));
    const text = jsQR(daten, seite, seite)!.data;
    expect(liesQr(text)).toEqual({ id: inserat.id, code: inserat.code });
    expect(uebergabeGueltig({ ...inserat, status: "verkauft" }, text)).toBe(true);
  });

  it("auch mit kleiner Auflösung noch lesbar", () => {
    const { daten, seite } = alsPixel(qrText(inserat), 3);
    expect(jsQR(daten, seite, seite)?.data).toBe(qrText(inserat));
  });
});
