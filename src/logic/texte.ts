// Texte, die etwas über ReRoom versprechen. Sie stehen hier an einer Stelle und sind getestet,
// damit die App nie mehr verspricht, als sie auf dem jeweiligen Gerät kann.

/** Slogan aus dem Businessplan. */
export const SLOGAN = "Ausmessen, Stil wählen, günstiger einrichten.";

/** ReRoom ist ein Schulprojekt, alle Möbel, Shops und Preise sind Beispiele. */
export const DEMO_HINWEIS = "ReRoom ist ein Schulprojekt. Möbel, Shops und Preise sind Beispiele.";

/** Wie gemessen wird: mit AR-Kamera (Android, Chrome), mit der Maßband-App (iPhone) oder von Hand. */
export type MessArt = "ar" | "apple" | "sonst";

export interface MessText {
  titel: string;
  text: string;
}

export function messArt(arOk: boolean, apple: boolean): MessArt {
  return arOk ? "ar" : apple ? "apple" : "sonst";
}

/** Text der ersten Willkommen-Karte. Verspricht die Kamera nur dort, wo sie wirklich misst. */
export function willkommenMessText(art: MessArt): MessText {
  if (art === "ar") {
    return {
      titel: "Miss deinen Raum mit der Kamera",
      text: "Du gehst durch den Raum und tippst Ecken, Tür und Treppenhaus an. ReRoom schätzt daraus die Maße. Ist es knapp, sagt dir der Passt-Check: Bitte nachmessen.",
    };
  }
  const wie = art === "apple"
    ? "Mit der Maßband-App deines iPhones misst du mit der Kamera, die Werte trägst du hier ein."
    : "Du misst mit dem Zollstock oder mit einem Foto und einer Bankkarte und trägst die Werte hier ein.";
  return {
    titel: "Miss deinen Raum Schritt für Schritt",
    text: `ReRoom zeigt dir, was du messen sollst: Tür, Treppenhaus und Raum. ${wie}`,
  };
}

/** Text im Aufruf auf der Startseite, solange noch kein Raum gemessen ist. */
export const START_MESSEN_TEXT = "Miss Tür, Treppenhaus und Raum, Schritt für Schritt. ReRoom zeigt dir dann nur Möbel, die wirklich passen.";

/** Erste Nachricht des Chats. Sagt ehrlich, was er kann und ob er deinen Raum schon kennt. */
export function chatBegruessung(raumName?: string): string {
  const raum = raumName
    ? `Ich kenne die Maße deines Raums „${raumName}“ und schlage nur Möbel vor, die durch Tür und Treppenhaus passen.`
    : "Ich kenne deinen Raum noch nicht. Miss ihn oder wähle einen Beispielraum, dann prüfe ich auch Tür und Treppenhaus.";
  return `Hallo! Ich bin der ReRoom-Assistent, noch ohne KI. Ich verstehe Möbelart, Farbe, Stil, Preis, Entfernung und Nische. ${raum} Was suchst du?`;
}
