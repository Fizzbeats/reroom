import { describe, expect, it } from "vitest";
import type { Moebel, Raum } from "../models/types";
import katalogJson from "../data/moebel.json";
import { BEISPIELRAEUME } from "../data/raeume";
import {
  abonnieren, aktiverTarif, darfRaumSpeichern, freundBeigetreten, gueltigBisText, neuesKonto, plusMonate, preisalarmUmschalten, TARIFE, tarifVon,
} from "./tarif";
import { AKTION_PROZENT, aktionAktiv, aktionText, cashbackProzent, NORMAL_PROZENT } from "./aktion";
import { berechneWarenkorb, cashbackCent, TRANSPORT_CENT, transportKostenCent } from "./preisRechner";
import { farbenAusPixeln, naechsteFarbe } from "./farbanalyse";
import { einrichten, kannStehen, ueberlappt, tuerBereich } from "./einrichten";
import { verbleibend, verbrauche, NEU } from "./chatLimit";

const katalog = katalogJson as Moebel[];
const wohn = BEISPIELRAEUME[2] as Raum;
const holen = (id: string) => katalog.find((m) => m.id === id)!;
const jetzt = new Date(2026, 10, 4, 12, 0);

describe("Tarife aus dem Businessplan", () => {
  it("fünf Tarife mit den Preisen aus dem Plan", () => {
    expect(TARIFE.map((t) => t.id)).toEqual(["free", "pass", "premium", "business-starter", "business-pro"]);
    expect(tarifVon("free").preisCent).toBe(0);
    expect(tarifVon("pass").preisCent).toBe(799);
    expect(tarifVon("premium").preisCent).toBe(2499);
    expect(tarifVon("business-starter").preisCent).toBe(1900);
    expect(tarifVon("business-pro").preisCent).toBe(5900);
  });

  it("Free: ein Raum, fünf Fragen, kein Video", () => {
    const t = tarifVon("free");
    expect(t).toMatchObject({ maxRaeume: 1, chatUnbegrenzt: false, video: false, preisalarm: false });
    expect(t.features).toContain("5 Chatbot-Fragen pro Tag");
  });

  it("Umzugs-Pass: unbegrenzt, Video, 3 Monate. Premium zusätzlich Preisalarm", () => {
    expect(tarifVon("pass")).toMatchObject({ maxRaeume: Infinity, chatUnbegrenzt: true, video: true, preisalarm: false, monate: 3 });
    expect(tarifVon("premium")).toMatchObject({ maxRaeume: Infinity, video: true, preisalarm: true, monate: 12 });
  });

  it("Business Starter: bis 5 Wohnungen, Pro unbegrenzt", () => {
    expect(tarifVon("business-starter").maxRaeume).toBe(5);
    expect(tarifVon("business-pro").maxRaeume).toBe(Infinity);
    expect(tarifVon("business-starter").fuerMakler).toBe(true);
  });

  it("Raumlimit wird je Tarif geprüft", () => {
    expect(darfRaumSpeichern(0, tarifVon("free"))).toBe(true);
    expect(darfRaumSpeichern(1, tarifVon("free"))).toBe(false);
    expect(darfRaumSpeichern(4, tarifVon("business-starter"))).toBe(true);
    expect(darfRaumSpeichern(5, tarifVon("business-starter"))).toBe(false);
    expect(darfRaumSpeichern(500, tarifVon("pass"))).toBe(true);
  });

  it("Monate addieren, auch am Monatsende", () => {
    expect(plusMonate(new Date(2026, 0, 31), 1).getDate()).toBe(28);
    expect(plusMonate(new Date(2026, 10, 4), 3).getMonth()).toBe(1);
    expect(plusMonate(new Date(2026, 10, 4), 12).getFullYear()).toBe(2027);
  });

  it("Umzugs-Pass läuft drei Monate, danach wieder Free", () => {
    const k = abonnieren(neuesKonto(), "pass", jetzt);
    expect(aktiverTarif(k, jetzt).id).toBe("pass");
    expect(aktiverTarif(k, new Date(2027, 1, 3)).id).toBe("pass");
    expect(aktiverTarif(k, new Date(2027, 1, 5)).id).toBe("free");
    expect(gueltigBisText(k, jetzt)).toContain("gültig bis 4. Februar 2027");
  });

  it("Free hat keine Laufzeit", () => {
    expect(gueltigBisText(neuesKonto(), jetzt)).toBe("Gratis, ohne Laufzeit");
  });

  it("Einladungscode ist gut lesbar und je Konto verschieden", () => {
    const a = neuesKonto(() => 0.1), b = neuesKonto(() => 0.9);
    expect(a.einladungsCode).toMatch(/^RR-[A-Z2-9]{5}$/);
    expect(a.einladungsCode).not.toBe(b.einladungsCode);
    expect(a.einladungsCode).not.toMatch(/[IO01]/);
  });

  it("der erste Freund schenkt den Umzugs-Pass, weitere nicht", () => {
    const k1 = freundBeigetreten(neuesKonto(), jetzt);
    expect(k1.freunde).toBe(1);
    expect(aktiverTarif(k1, jetzt).id).toBe("pass");
    const k2 = freundBeigetreten(k1, jetzt);
    expect(k2.freunde).toBe(2);
    expect(k2.bis).toBe(k1.bis);
  });

  it("wer Premium hat, bekommt keinen Pass geschenkt", () => {
    const k = freundBeigetreten(abonnieren(neuesKonto(), "premium", jetzt), jetzt);
    expect(k.tarif).toBe("premium");
  });

  it("Preisalarm an und aus", () => {
    const a = preisalarmUmschalten(neuesKonto(), "sofa-01");
    expect(a.preisalarm).toEqual(["sofa-01"]);
    expect(preisalarmUmschalten(a, "sofa-01").preisalarm).toEqual([]);
  });

  it("Chat-Limit hängt am Tarif: ohne Pass 5 Fragen, mit Tarif unbegrenzt", () => {
    expect(verbleibend(verbrauche(NEU, "2026-11-04"), "2026-11-04")).toBe(4);
  });
});

describe("Start-Aktion: 6 % Cashback in den ersten drei Monaten", () => {
  it("läuft vom 1. November 2026 bis 31. Januar 2027", () => {
    expect(aktionAktiv(new Date(2026, 9, 31))).toBe(false);
    expect(aktionAktiv(new Date(2026, 10, 1))).toBe(true);
    expect(aktionAktiv(new Date(2027, 0, 31, 23, 59))).toBe(true);
    expect(aktionAktiv(new Date(2027, 1, 1))).toBe(false);
  });

  it("6 % in der Aktion, sonst 4 %", () => {
    expect(cashbackProzent(jetzt)).toBe(AKTION_PROZENT);
    expect(cashbackProzent(new Date(2027, 6, 1))).toBe(NORMAL_PROZENT);
    expect([AKTION_PROZENT, NORMAL_PROZENT]).toEqual([6, 4]);
  });

  it("Text nennt Prozent und letzten Tag", () => {
    expect(aktionText(jetzt)).toBe("Start-Aktion: 6 % Cashback statt 4 % bis 31. Januar 2027");
    expect(aktionText(new Date(2027, 6, 1))).toBeUndefined();
  });

  it("Cashback im Warenkorb folgt dem Prozentsatz", () => {
    const sofa = holen("sofa-02"); // 649 €, neu
    expect(cashbackCent(64900)).toBe(2596);
    expect(cashbackCent(64900, 6)).toBe(3894);
    expect(berechneWarenkorb([sofa]).cashbackCent).toBe(2596);
    expect(berechneWarenkorb([sofa], 6).cashbackCent).toBe(3894);
  });

  it("der Werbesatz: 800 € werden mit 6 % zu 752 €", () => {
    expect(80000 - cashbackCent(80000, 6)).toBe(75200);
    expect(80000 - cashbackCent(80000)).toBe(76800); // wie im Businessplan: 768 €
  });
});

describe("Transport", () => {
  it("40 € je gebuchtem Möbel", () => {
    expect(TRANSPORT_CENT).toBe(4000);
    expect(transportKostenCent(0)).toBe(0);
    expect(transportKostenCent(2)).toBe(8000);
    expect(transportKostenCent(-1)).toBe(0);
  });
});

describe("Farben aus Fotos", () => {
  const flaeche = (rgb: [number, number, number], n: number) => Array.from({ length: n }, () => [...rgb, 255]).flat();

  it("ordnet einzelne Farben der nächsten Farbe zu", () => {
    expect(naechsteFarbe(201, 105, 76)).toBe("terrakotta");
    expect(naechsteFarbe(240, 240, 235)).toBe("weiss");
    expect(naechsteFarbe(30, 30, 30)).toBe("schwarz");
    expect(naechsteFarbe(120, 120, 125)).toBe("grau");
    expect(naechsteFarbe(205, 165, 115)).toBe("holz");
  });

  it("findet die zwei häufigsten Farben", () => {
    const daten = [...flaeche([236, 234, 229], 700), ...flaeche([201, 105, 76], 250), ...flaeche([46, 46, 46], 50)];
    expect(farbenAusPixeln(daten)).toEqual(["weiss", "terrakotta"]);
  });

  it("ignoriert sehr kleine Anteile und durchsichtige Punkte", () => {
    const daten = [...flaeche([163, 167, 171], 900), ...flaeche([201, 105, 76], 20), ...Array.from({ length: 400 }, () => [0, 0, 0, 0]).flat()];
    expect(farbenAusPixeln(daten)).toEqual(["grau"]);
  });

  it("leeres Bild liefert nichts", () => {
    expect(farbenAusPixeln([])).toEqual([]);
    expect(farbenAusPixeln([0, 0, 0, 0])).toEqual([]);
  });
});

describe("Möbel mit dem Finger verschieben", () => {
  const set = ["sofa-01", "teppich-01", "tisch-03"].map(holen);
  const sofa = holen("sofa-01");

  it("ein festgelegter Platz wird übernommen", () => {
    const r = einrichten(wohn, set, { "sofa-01": { x: 150, y: 300, gedreht: false } });
    const p = r.platziert.find((x) => x.moebel.id === "sofa-01")!;
    expect([p.x, p.y, p.w, p.h]).toEqual([150, 300, 200, 85]);
  });

  it("gedreht werden Breite und Tiefe getauscht", () => {
    const r = einrichten(wohn, set, { "sofa-01": { x: 10, y: 100, gedreht: true } });
    const p = r.platziert.find((x) => x.moebel.id === "sofa-01")!;
    expect([p.w, p.h]).toEqual([85, 200]);
  });

  it("ein ungültiger Platz (in der Tür) wird ignoriert, das Möbel wird neu gesucht", () => {
    const tuer = tuerBereich(wohn);
    const r = einrichten(wohn, set, { "sofa-01": { x: tuer.x, y: tuer.y, gedreht: false } });
    const p = r.platziert.find((x) => x.moebel.id === "sofa-01")!;
    expect(ueberlappt(p, tuerBereich(wohn))).toBe(false);
  });

  it("die anderen Möbel weichen dem festgelegten aus", () => {
    const r = einrichten(wohn, set, { "sofa-01": { x: 100, y: 200, gedreht: false } });
    const stehend = r.platziert.filter((p) => p.moebel.kategorie !== "teppich");
    for (const a of stehend) for (const b of stehend) if (a !== b) expect(ueberlappt(a, b)).toBe(false);
  });

  it("kannStehen: im Raum, nicht in der Tür, nicht auf anderen Möbeln", () => {
    const r = einrichten(wohn, [sofa, holen("tisch-03")]);
    expect(kannStehen(wohn, r.platziert, sofa, { x: 100, y: 5, w: 200, h: 85 })).toBe(true);
    expect(kannStehen(wohn, r.platziert, sofa, { x: -10, y: 5, w: 200, h: 85 })).toBe(false); // links aus dem Raum
    expect(kannStehen(wohn, r.platziert, sofa, { x: 300, y: 5, w: 200, h: 85 })).toBe(false); // rechts aus dem Raum
    const tuer = tuerBereich(wohn);
    expect(kannStehen(wohn, r.platziert, sofa, { x: tuer.x, y: tuer.y, w: 200, h: 85 })).toBe(false);
    const tisch = r.platziert.find((p) => p.moebel.id === "tisch-03")!;
    expect(kannStehen(wohn, r.platziert, sofa, { x: tisch.x, y: tisch.y, w: 200, h: 85 })).toBe(false);
  });

  it("ein Möbel steht nicht im Weg, wenn es nur sich selbst überlappt", () => {
    const r = einrichten(wohn, [sofa]);
    const p = r.platziert[0]!;
    expect(kannStehen(wohn, r.platziert, sofa, { x: p.x + 5, y: p.y, w: p.w, h: p.h })).toBe(true);
  });
});

import { aktionKurz } from "./aktion";

describe("Aktion kurz", () => {
  it("nennt Prozent und letzten Tag, nur während der Aktion", () => {
    expect(aktionKurz(new Date(2026, 10, 5))).toBe("6\u00a0% Cashback bis 31. Januar");
    expect(aktionKurz(new Date(2027, 1, 2))).toBeUndefined();
  });
});
