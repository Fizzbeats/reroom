import { describe, expect, it } from "vitest";
import { ausSternen, beispielBewertung, bewertungText } from "./bewertung";
import { leseTeilLink, teilLink } from "./teilen";

describe("Bewertungen", () => {
  it("Beispielwerte sind stabil und im erlaubten Bereich", () => {
    const a = beispielBewertung("Privat, Chemnitz-Kaßberg");
    expect(beispielBewertung("Privat, Chemnitz-Kaßberg")).toEqual(a);
    expect(a.schnitt).toBeGreaterThanOrEqual(4.2);
    expect(a.schnitt).toBeLessThanOrEqual(5);
    expect(a.anzahl).toBeGreaterThanOrEqual(4);
    expect(a.anzahl).toBeLessThanOrEqual(40);
  });
  it("rechnet den Schnitt aus Sternen", () => {
    expect(ausSternen([5, 4])).toEqual({ anzahl: 2, schnitt: 4.5 });
    expect(ausSternen([])).toBeUndefined();
    expect(ausSternen([0, 6, 2.5])).toBeUndefined();
  });
  it("schreibt Zahlen auf Deutsch", () => {
    expect(bewertungText({ anzahl: 1, schnitt: 5 })).toBe("5,0 von 5 · 1 Bewertung");
    expect(bewertungText({ anzahl: 12, schnitt: 4.7 })).toBe("4,7 von 5 · 12 Bewertungen");
  });
});

describe("Wohnung teilen", () => {
  const raum = { id: "r1", name: "Mein Zimmer äöü", breiteCm: 400, tiefeCm: 500, hoeheCm: 250, tuerBreiteCm: 90, tuerHoeheCm: 210, treppenhausBreiteCm: 110 };
  it("Link lässt sich wieder lesen", () => {
    const link = teilLink({ raum, moebelIds: ["sofa-01"], feste: { "sofa-01": { x: 10, y: 20, gedreht: true } } }, "https://x.de/reroom/");
    const d = leseTeilLink(link.slice(link.indexOf("#")));
    expect(d?.raum.name).toBe("Mein Zimmer äöü");
    expect(d?.moebelIds).toEqual(["sofa-01"]);
    expect(d?.feste["sofa-01"]).toEqual({ x: 10, y: 20, gedreht: true });
  });
  it("kaputte oder fremde Links ergeben nichts", () => {
    expect(leseTeilLink("#wohnung=%%%")).toBeUndefined();
    expect(leseTeilLink("#anderes=1")).toBeUndefined();
    expect(leseTeilLink("#wohnung=" + btoa(JSON.stringify({ raum: { name: "x" }, moebelIds: [] })))).toBeUndefined();
  });
});

import { liesQr, liesUebergabeLink, uebergabeLink } from "./verkaufen";

describe("Übergabe-Link für das zweite Handy", () => {
  const i = { id: "ins-abc123", code: "123456" };
  it("Link lässt sich lesen und enthält die Verbindungs-Nummer", () => {
    const link = uebergabeLink(i, "a1b2-c3d4", "https://x.de/reroom/");
    expect(liesUebergabeLink(link.slice(link.indexOf("#")))).toEqual({ id: "ins-abc123", code: "123456", peer: "a1b2-c3d4" });
    expect(liesQr(link)).toEqual({ id: "ins-abc123", code: "123456" });
  });
  it("fremde oder kaputte Links werden abgelehnt", () => {
    expect(liesUebergabeLink("#uebergabe/x/12/p")).toBeUndefined();
    expect(liesUebergabeLink("#uebergabe/x/123456/p q")).toBeUndefined();
    expect(liesQr("https://x.de/#anderes")).toBeUndefined();
  });
});

import { stilVorschlag } from "./farbanalyse";

describe("Stil-Vorschlag aus Bildfarben", () => {
  it("schlägt je Farbmischung einen Stil vor", () => {
    expect(stilVorschlag(["terrakotta", "holz"])).toBe("boho");
    expect(stilVorschlag(["schwarz", "grau"])).toBe("industrial");
    expect(stilVorschlag(["schwarz", "weiss"])).toBe("modern");
    expect(stilVorschlag(["weiss", "holz"])).toBe("skandi");
    expect(stilVorschlag(["braun", "holz"])).toBe("vintage");
    expect(stilVorschlag([])).toBeUndefined();
  });
});
