/** Kann dieses Gerät die eingebaute Kamera öffnen? (Braucht https oder localhost.) */
export function kameraMoeglich(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext;
}

export type Kameraseite = "environment" | "user";

/** Öffnet die Kamera. Standard ist die Rückkamera, das ist die für Möbelfotos. */
export function kameraStarten(seite: Kameraseite): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: seite }, width: { ideal: 1920 }, height: { ideal: 1440 } },
  });
}

export function stromStoppen(strom?: MediaStream | null): void {
  strom?.getTracks().forEach((spur) => spur.stop());
}

/** Macht aus dem aktuellen Bild der Kamera eine JPEG-Datei, höchstens `max` Pixel an der längsten Kante. */
export function bildAusVideo(video: HTMLVideoElement, max = 1600, qualitaet = 0.85): Promise<File> {
  const faktor = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
  const leinwand = document.createElement("canvas");
  leinwand.width = Math.max(1, Math.round(video.videoWidth * faktor));
  leinwand.height = Math.max(1, Math.round(video.videoHeight * faktor));
  const kontext = leinwand.getContext("2d");
  if (!kontext) return Promise.reject(new Error("Das Foto konnte nicht aufgenommen werden."));
  kontext.drawImage(video, 0, 0, leinwand.width, leinwand.height);
  return new Promise((ok, fehler) =>
    leinwand.toBlob(
      (blob) => (blob ? ok(new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" })) : fehler(new Error("Das Foto konnte nicht gespeichert werden."))),
      "image/jpeg",
      qualitaet,
    ),
  );
}
