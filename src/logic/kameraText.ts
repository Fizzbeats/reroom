// Verständliche Hinweise, wenn die eingebaute Kamera nicht startet. Immer mit einem Ausweg (Galerie).

export function kameraFehlerText(fehler: unknown, sicher = true): string {
  if (!sicher) return "Die Kamera braucht eine sichere Verbindung (https). Du kannst stattdessen ein Foto aus der Galerie wählen.";
  const name = fehler instanceof DOMException || fehler instanceof Error ? fehler.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Der Kamerazugriff wurde nicht erlaubt. Erlaube die Kamera in den Einstellungen deines Browsers, oder wähle ein Foto aus der Galerie.";
    case "NotFoundError":
    case "OverconstrainedError":
    case "DevicesNotFoundError":
      return "Auf diesem Gerät wurde keine Kamera gefunden. Wähle ein Foto aus der Galerie.";
    case "NotReadableError":
    case "AbortError":
      return "Die Kamera wird gerade von einer anderen App benutzt. Schließe sie und versuche es nochmal, oder wähle ein Foto aus der Galerie.";
    default:
      return "Die Kamera konnte nicht starten. Wähle ein Foto aus der Galerie.";
  }
}

/** Beschriftung unter dem Rahmen, je nachdem, was fotografiert wird. */
export const RAHMEN_TEXT = {
  moebel: "Das ganze Möbel in den Rahmen",
  karte: "Karte flach an die Stelle halten, die du misst",
  bild: "Ein Einrichtungsbild in den Rahmen",
} as const;

export type RahmenArt = keyof typeof RAHMEN_TEXT;
