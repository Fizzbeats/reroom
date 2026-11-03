import { describe, expect, it } from "vitest";
import { chatBegruessung, DEMO_HINWEIS, messArt, SLOGAN, START_MESSEN_TEXT, willkommenMessText } from "./texte";

describe("Slogan und Hinweise", () => {
  it("der Slogan lautet wie im Businessplan", () => {
    expect(SLOGAN).toBe("Ausmessen, Stil wählen, günstiger einrichten.");
  });

  it("der Demo-Hinweis sagt, dass die Daten Beispiele sind", () => {
    expect(DEMO_HINWEIS).toContain("Schulprojekt");
    expect(DEMO_HINWEIS).toContain("Beispiele");
  });
});

describe("Messen: die Kamera wird nur dort versprochen, wo sie misst", () => {
  it("welche Art zu Messen gilt", () => {
    expect(messArt(true, false)).toBe("ar");
    expect(messArt(false, true)).toBe("apple");
    expect(messArt(false, false)).toBe("sonst");
    expect(messArt(true, true)).toBe("ar");
  });

  it("Android mit AR: Kamera, aber als Schätzung mit Nachmessen-Hinweis", () => {
    const t = willkommenMessText("ar");
    expect(t.titel).toContain("Kamera");
    expect(t.text).toContain("schätzt");
    expect(t.text).toContain("nachmessen");
  });

  it("iPhone: keine Live-Kamera versprochen, dafür die Maßband-App", () => {
    const t = willkommenMessText("apple");
    expect(t.titel).not.toContain("Kamera");
    expect(t.text).toContain("Maßband-App");
    expect(t.text).not.toMatch(/Kein Zollstock|fertig/);
  });

  it("andere Geräte: Zollstock oder Foto mit Bankkarte", () => {
    const t = willkommenMessText("sonst");
    expect(t.text).toContain("Zollstock");
    expect(t.text).toContain("Bankkarte");
    expect(t.titel).not.toContain("Kamera");
  });

  it.each(["apple", "sonst"] as const)("%s: nichts von „Kein Zollstock“", (art) => {
    const t = willkommenMessText(art);
    expect(`${t.titel} ${t.text}`).not.toMatch(/Kein Zollstock|Zollstock brauchst du nicht/);
  });

  it("der Aufruf auf der Startseite verspricht keine Kamera", () => {
    expect(START_MESSEN_TEXT).not.toMatch(/Kamera/);
    expect(START_MESSEN_TEXT).toContain("Tür, Treppenhaus und Raum");
  });

  it("keine erfundenen Genauigkeitsangaben", () => {
    for (const art of ["ar", "apple", "sonst"] as const) {
      const t = willkommenMessText(art);
      expect(`${t.titel} ${t.text}`).not.toMatch(/±|\d\s?%|auf den Zentimeter/);
    }
  });
});

describe("Chat-Begrüßung", () => {
  it("nennt den Raum, wenn er bekannt ist", () => {
    const t = chatBegruessung("Wohnzimmer");
    expect(t).toContain("Wohnzimmer");
    expect(t).toContain("Ich kenne die Maße");
  });

  it("sagt ehrlich, wenn der Raum noch fehlt", () => {
    const t = chatBegruessung();
    expect(t).toContain("noch nicht");
    expect(t).not.toContain("Ich kenne die Maße");
  });

  it("sagt, dass der Assistent noch keine KI ist und was er versteht", () => {
    for (const t of [chatBegruessung(), chatBegruessung("Wohnzimmer")]) {
      expect(t).toContain("ohne KI");
      expect(t).toContain("Möbelart");
    }
  });
});
