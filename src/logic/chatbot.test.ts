import { describe, expect, it } from "vitest";
import type { Moebel, Raum } from "../models/types";
import katalogJson from "../data/moebel.json";
import { BEISPIELRAEUME } from "../data/raeume";
import { antworte, MAX_TREFFER, suche, verstehe } from "./chatbot";
import { FRAGEN_PRO_TAG, mitPass, NEU, tagVon, verbleibend, verbrauche } from "./chatLimit";
import { pruefeMoebel } from "./passtCheck";

const katalog = katalogJson as Moebel[];
const [wg, , wohn] = BEISPIELRAEUME as [Raum, Raum, Raum];
const ids = (liste: Moebel[]) => liste.map((m) => m.id);

describe("Chatbot versteht Sätze", () => {
  it("das Beispiel aus dem Businessplan", () => {
    const k = verstehe("Graues Sofa unter 400 €, das in meine Nische passt.");
    expect(k).toMatchObject({ kategorie: "sofa", farben: ["grau"], maxPreis: 400 });
  });

  it("Möbelart auch bei zusammengesetzten Wörtern", () => {
    expect(verstehe("Eine Tischlampe").kategorie).toBe("lampe");
    expect(verstehe("Ein Couchtisch").kategorie).toBe("tisch");
    expect(verstehe("Eine Couch bitte").kategorie).toBe("sofa");
    expect(verstehe("Schreibtisch").kategorie).toBe("tisch");
    expect(verstehe("ein Bücherregal").kategorie).toBe("regal");
  });

  it("Farben, Stile und Zustand", () => {
    const k = verstehe("Weißes Skandi Regal, gebraucht");
    expect(k).toMatchObject({ kategorie: "regal", farben: ["weiss"], stile: ["skandi"], zustand: "gebraucht" });
  });

  it("Preis in verschiedenen Formen", () => {
    expect(verstehe("Sofa bis 300 Euro").maxPreis).toBe(300);
    expect(verstehe("Sofa für 250 €").maxPreis).toBe(250);
    expect(verstehe("Sofa max. 199,50 €").maxPreis).toBe(199.5);
    expect(verstehe("Sofa 120 € Budget").maxPreis).toBe(120);
  });

  it("Zentimeter und Kilometer sind kein Preis", () => {
    expect(verstehe("Sofa für eine Nische von 140 cm").maxPreis).toBeUndefined();
    expect(verstehe("Sofa unter 5 km").maxPreis).toBeUndefined();
  });

  it("Entfernung macht das Möbel gebraucht", () => {
    expect(verstehe("Stuhl bis 10 km")).toMatchObject({ maxKm: 10, zustand: "gebraucht" });
  });

  it("„neu und gebraucht“ legt nichts fest", () => {
    expect(verstehe("Sofa neu und gebraucht").zustand).toBeUndefined();
  });

  it("Nische mit Breite", () => {
    expect(verstehe("Sofa für meine Nische, 210 cm breit").nischeBreiteCm).toBe(210);
    expect(verstehe("Sofa Nische 1,5 m").nischeBreiteCm).toBe(150);
    expect(verstehe("Sofa 210 cm").nischeBreiteCm).toBeUndefined();
  });
});

describe("Chatbot sucht nur, was passt", () => {
  it("fragt nach der Nischenbreite und merkt sich die Wünsche", () => {
    const erste = antworte("Graues Sofa unter 400 €, das in meine Nische passt.", katalog, wohn);
    expect(erste.rueckfrage).toBe("nische");
    expect(erste.text).toContain("Wie breit");
    expect(erste.treffer).toEqual([]);

    const zweite = antworte("210 cm", katalog, wohn, { kriterien: erste.kriterien, rueckfrage: erste.rueckfrage });
    expect(ids(zweite.treffer)).toEqual(["sofa-01"]);
    expect(zweite.rueckfrage).toBeUndefined();
  });

  it("versteht die Antwort auf die Rückfrage nicht, fragt nochmal", () => {
    const erste = antworte("Graues Sofa in meine Nische", katalog, wohn);
    const zweite = antworte("keine Ahnung", katalog, wohn, { kriterien: erste.kriterien, rueckfrage: erste.rueckfrage });
    expect(zweite.rueckfrage).toBe("nische");
    expect(zweite.text).toContain("nicht als Maß verstanden");
  });

  it("lässt ein Sofa weg, das nicht in die Nische passt", () => {
    const k = verstehe("Sofa Nische 150 cm");
    expect(suche(katalog, k, wohn).every((m) => m.masseCm.breite + 2 <= 150)).toBe(true);
  });

  it("schlägt nie etwas vor, das im Passt-Check rot ist", () => {
    for (const raum of [wg, wohn]) {
      for (const m of suche(katalog, { farben: [], stile: [] }, raum)) expect(pruefeMoebel(m, raum).ampel).not.toBe("rot");
    }
  });

  it("zeigt höchstens drei Treffer, sortiert nach Stil-Punkten", () => {
    const a = antworte("Skandi Möbel", katalog, wohn);
    expect(a.treffer.length).toBeLessThanOrEqual(MAX_TREFFER);
    expect(a.text).toContain("Treffer");
  });

  it("„günstig“ sortiert nach Preis", () => {
    const a = antworte("günstiges Regal", katalog, wohn);
    const preise = a.treffer.map((m) => m.preis);
    expect(preise).toEqual([...preise].sort((x, y) => x - y));
  });

  it("lockert Wünsche und sagt, was weggelassen wurde", () => {
    // Im WG-Zimmer passt kein graues Sofa (Tür 80 cm), ohne die Farbe schon
    const a = antworte("graues Sofa", katalog, wg);
    expect(a.text).toContain("Ohne die Farbe");
    expect(a.treffer.length).toBeGreaterThan(0);
  });

  it("sagt ehrlich, wenn gar nichts passt", () => {
    const a = antworte("Bett unter 5 €", katalog, wg);
    expect(a.treffer).toEqual([]);
    expect(a.text).toContain("nichts");
  });

  it("ohne Raum weist es auf das Messen hin", () => {
    const a = antworte("Skandi Regal", katalog);
    expect(a.text).toContain("Miss deinen Raum");
  });
});

describe("Chatbot beantwortet andere Fragen", () => {
  it("Passt-Check für ein genanntes Möbel", () => {
    const a = antworte("Passt das Sofa Lund durch meine Tür?", katalog, wohn);
    expect(ids(a.treffer)).toEqual(["sofa-01"]);
    expect(a.text).toContain("Knapp");
    expect(a.text).toContain("Bitte nachmessen");
  });

  it("Erklärung zum Cashback und Käuferschutz mit richtigen Beträgen", () => {
    expect(antworte("Wie funktioniert der Cashback?", katalog).text).toContain("25,96");
    expect(antworte("Was ist der Käuferschutz?", katalog).text).toContain("7,70");
  });

  it("Begrüßung, Hilfe und leere Eingabe", () => {
    expect(antworte("Hallo!", katalog).text).toContain("Hallo");
    expect(antworte("Was kannst du?", katalog).text).toContain("Nische");
    expect(antworte("   ", katalog).text).toContain("Frag mich");
  });

  it("ohne Möbelwunsch fragt er nach", () => {
    expect(antworte("Wie ist das Wetter?", katalog).text).toContain("Was suchst du");
  });
});

describe("Tageslimit", () => {
  const heute = "2026-11-04";

  it("fünf Fragen pro Tag im Gratis-Tarif", () => {
    let v = NEU;
    expect(verbleibend(v, heute)).toBe(FRAGEN_PRO_TAG);
    for (let i = 0; i < 5; i++) v = verbrauche(v, heute);
    expect(verbleibend(v, heute)).toBe(0);
  });

  it("am nächsten Tag geht es von vorn los", () => {
    let v = NEU;
    for (let i = 0; i < 5; i++) v = verbrauche(v, heute);
    expect(verbleibend(v, "2026-11-05")).toBe(5);
    expect(verbrauche(v, "2026-11-05").anzahl).toBe(1);
  });

  it("mit Umzugs-Pass unbegrenzt", () => {
    const v = mitPass(NEU);
    expect(verbleibend(v, heute)).toBe(Infinity);
    expect(verbrauche(v, heute)).toEqual(v);
  });

  it("Tag in Ortszeit", () => {
    expect(tagVon(new Date(2026, 10, 4, 23, 59))).toBe("2026-11-04");
    expect(tagVon(new Date(2026, 0, 2))).toBe("2026-01-02");
  });
});
