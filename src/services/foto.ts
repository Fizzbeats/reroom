/**
 * Verkleinert ein Foto auf höchstens `max` Pixel Kantenlänge und gibt es als JPEG-Text (data-URL) zurück.
 * Handyfotos sind mehrere Megabyte groß und passen sonst nicht in den Speicher des Browsers.
 */
export async function bildVerkleinern(datei: File, max = 900, qualitaet = 0.72): Promise<string> {
  const quelle = await laden(datei);
  const faktor = Math.min(1, max / Math.max(quelle.breite, quelle.hoehe));
  const leinwand = document.createElement("canvas");
  leinwand.width = Math.max(1, Math.round(quelle.breite * faktor));
  leinwand.height = Math.max(1, Math.round(quelle.hoehe * faktor));
  const kontext = leinwand.getContext("2d");
  if (!kontext) throw new Error("Das Foto konnte nicht verarbeitet werden.");
  kontext.drawImage(quelle.bild, 0, 0, leinwand.width, leinwand.height);
  quelle.freigeben();
  return leinwand.toDataURL("image/jpeg", qualitaet);
}

interface Geladen {
  bild: CanvasImageSource;
  breite: number;
  hoehe: number;
  freigeben: () => void;
}

async function laden(datei: File): Promise<Geladen> {
  // createImageBitmap beachtet die Drehung aus den Foto-Daten (EXIF), sonst stehen Handyfotos auf dem Kopf
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(datei);
      return { bild: bitmap, breite: bitmap.width, hoehe: bitmap.height, freigeben: () => bitmap.close() };
    } catch {
      // Fällt auf den Weg über <img> zurück
    }
  }
  const url = URL.createObjectURL(datei);
  const bild = new Image();
  await new Promise<void>((ok, fehler) => {
    bild.onload = () => ok();
    bild.onerror = () => fehler(new Error("Dieses Bild kann nicht gelesen werden."));
    bild.src = url;
  });
  return { bild, breite: bild.naturalWidth, hoehe: bild.naturalHeight, freigeben: () => URL.revokeObjectURL(url) };
}
