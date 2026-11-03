import { describe, expect, it } from "vitest";
import { arFehlerText, arStatusAus, istApple } from "./arStatus";

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1";
const basis = { sicher: true, hatXr: true, unterstuetzt: true, userAgent: ANDROID };

describe("AR-Status", () => {
  it("Android mit Chrome und AR-Unterstützung ist in Ordnung", () => {
    expect(arStatusAus(basis)).toEqual({ ok: true, grund: "ok", text: "" });
  });

  it("ohne https meldet es die unsichere Verbindung (zuerst)", () => {
    const s = arStatusAus({ ...basis, sicher: false, userAgent: IPHONE });
    expect(s.grund).toBe("unsicher");
    expect(s.text).toContain("https");
  });

  it("iPhone bekommt den Hinweis auf Maßband und Foto", () => {
    const s = arStatusAus({ ...basis, hatXr: false, userAgent: IPHONE });
    expect(s.grund).toBe("iphone");
    expect(s.text).toContain("Maßband");
  });

  it("Browser ohne WebXR wird erkannt", () => {
    expect(arStatusAus({ ...basis, hatXr: false }).grund).toBe("browser");
  });

  it("Handy ohne AR-Unterstützung nennt die Play-Dienste", () => {
    const s = arStatusAus({ ...basis, unterstuetzt: false });
    expect(s.grund).toBe("handy");
    expect(s.text).toContain("Play-Dienste");
  });

  it("erkennt Apple-Geräte", () => {
    expect(istApple(IPHONE)).toBe(true);
    expect(istApple("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe(true);
    expect(istApple(ANDROID)).toBe(false);
  });
});

describe("AR-Fehlertexte", () => {
  it("Kamera nicht erlaubt", () => {
    expect(arFehlerText(new DOMException("x", "NotAllowedError"))).toContain("Erlaube die Kamera");
  });
  it("nicht unterstützt", () => {
    expect(arFehlerText(new DOMException("x", "NotSupportedError"))).toContain("unterstützt");
  });
  it("Kamera belegt", () => {
    expect(arFehlerText(new DOMException("x", "InvalidStateError"))).toContain("andere");
  });
  it("unbekannter Fehler mit Meldung", () => {
    expect(arFehlerText(new Error("Boom"))).toBe("Die Kamera konnte nicht starten: Boom");
  });
  it("ganz unbekannter Fehler", () => {
    expect(arFehlerText("komisch")).toContain("Versuche es nochmal");
  });
});
