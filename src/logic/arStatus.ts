// Erklärt in einfachen Worten, ob und warum die AR-Kamera-Messung auf diesem Gerät geht.

export interface ArUmgebung {
  /** true bei HTTPS oder localhost */
  sicher: boolean;
  /** Der Browser kennt die WebXR-Schnittstelle */
  hatXr: boolean;
  /** Antwort von isSessionSupported("immersive-ar"), undefined bei Fehler */
  unterstuetzt?: boolean;
  userAgent: string;
}

export type ArGrund = "ok" | "unsicher" | "iphone" | "browser" | "handy";

export interface ArStatus {
  ok: boolean;
  grund: ArGrund;
  /** Satz für Nutzer, leer wenn alles in Ordnung ist */
  text: string;
}

export const istApple = (ua: string) => /iPhone|iPad|iPod/i.test(ua);

export function arStatusAus(u: ArUmgebung): ArStatus {
  if (!u.sicher) {
    return { ok: false, grund: "unsicher", text: "Die Seite läuft nicht über eine sichere Verbindung (https). Öffne ReRoom über den Link mit https://." };
  }
  if (istApple(u.userAgent)) {
    return {
      ok: false,
      grund: "iphone",
      text: "Auf dem iPhone kann der Browser nicht live mit der Kamera messen. Nutze die Maßband-App deines iPhones oder miss mit einem Foto und einer Bankkarte.",
    };
  }
  if (!u.hatXr) {
    return { ok: false, grund: "browser", text: "Dieser Browser kann keine AR-Messung. Öffne ReRoom in Chrome auf einem Android-Handy." };
  }
  if (!u.unterstuetzt) {
    return {
      ok: false,
      grund: "handy",
      text: "Dein Handy meldet keine AR-Unterstützung. Auf Android braucht es „Google Play-Dienste für AR“ (im Play Store installieren) und ein neueres Handy. Du kannst stattdessen mit einem Foto messen.",
    };
  }
  return { ok: true, grund: "ok", text: "" };
}

/** Übersetzt Fehler beim Start der AR-Sitzung in verständliche Hinweise. */
export function arFehlerText(fehler: unknown): string {
  const name = fehler instanceof DOMException ? fehler.name : fehler instanceof Error ? fehler.name : "";
  const meldung = fehler instanceof Error ? fehler.message : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Der Kamerazugriff wurde nicht erlaubt. Erlaube die Kamera für diese Seite (Schloss-Symbol in der Adressleiste) und versuche es nochmal.";
  }
  if (name === "NotSupportedError") {
    return "Dein Handy unterstützt die AR-Messung nicht. Miss mit einem Foto oder tippe die Maße ein.";
  }
  if (name === "InvalidStateError") {
    return "Die Kamera wird gerade von einer anderen App benutzt. Schließe andere Kamera-Apps und versuche es nochmal.";
  }
  return meldung ? `Die Kamera konnte nicht starten: ${meldung}` : "Die Kamera konnte nicht starten. Versuche es nochmal oder miss mit einem Foto.";
}
