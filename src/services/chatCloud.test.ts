import { describe, expect, it } from "vitest";
import { frageKi } from "./chatCloud";
import type { Moebel, Raum } from "../models/types";

const sofa = (id: string, breite: number): Moebel => ({
  id, name: id, kategorie: "sofa", zustand: "neu", preis: 100, anbieter: "x", masseCm: { breite, tiefe: 80, hoehe: 80 }, stile: [], farben: ["grau"], beschreibung: "",
});
const raum: Raum = { id: "r", name: "R", breiteCm: 400, tiefeCm: 400, hoeheCm: 250, tuerBreiteCm: 90, tuerHoeheCm: 210, treppenhausBreiteCm: 110 };
const antwort = (daten: unknown, ok = true) => (async () => ({ ok, json: async () => daten }) as Response) as unknown as typeof fetch;

describe("KI-Chat über die Cloud", () => {
  it("nimmt nur existierende Möbel, die nicht rot sind", async () => {
    const katalog = [sofa("klein", 150), sofa("riesig", 900)];
    const r = await frageKi("https://x", "Sofa", katalog, raum, antwort({ text: "Hier:", moebelIds: ["klein", "riesig", "gibtsnicht"] }));
    expect(r?.treffer.map((m) => m.id)).toEqual(["klein"]);
    expect(r?.text).toBe("Hier:");
  });
  it("gibt bei Fehlern undefined zurück, damit der lokale Chat übernimmt", async () => {
    expect(await frageKi("https://x", "Sofa", [], raum, antwort({}, false))).toBeUndefined();
    expect(await frageKi("https://x", "Sofa", [], raum, antwort({ text: 5 }))).toBeUndefined();
    expect(await frageKi("https://x", "Sofa", [], raum, (async () => { throw new Error("offline"); }) as unknown as typeof fetch)).toBeUndefined();
  });
});
