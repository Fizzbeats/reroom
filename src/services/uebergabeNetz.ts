// Übergabe zwischen zwei Handys ohne eigenen Server: Verkäufer und Käufer verbinden sich direkt (WebRTC).
// Nur der Verbindungsaufbau läuft über den kostenlosen öffentlichen Vermittler von PeerJS, die Daten selbst gehen direkt von Handy zu Handy.
// Gesendet wird nur Inserat-Nummer und Code, nichts anderes.

import type { DataConnection, Peer as PeerTyp } from "peerjs";

export type Antwort = { art: "ok"; titel: string } | { art: "falsch" };

interface Anfrage {
  art: "uebergabe";
  id: string;
  code: string;
}

const WARTEZEIT_MS = 12000;

const istAnfrage = (d: unknown): d is Anfrage =>
  typeof d === "object" && d !== null && (d as Anfrage).art === "uebergabe" && typeof (d as Anfrage).id === "string" && typeof (d as Anfrage).code === "string";

export interface Verkaeufer {
  stoppen: () => void;
}

/**
 * Verkäufer-Seite: wartet auf den Käufer. `pruefen` bekommt Nummer und Code und gibt den Titel zurück, wenn beides stimmt.
 * `onBereit` liefert die Adresse, die in den QR-Code kommt.
 */
export async function verkaeuferStarten(
  pruefen: (id: string, code: string) => string | undefined,
  onBereit: (peerId: string) => void,
  onFehler: () => void,
): Promise<Verkaeufer> {
  const { Peer } = await import("peerjs");
  const peer: PeerTyp = new Peer();
  peer.on("open", onBereit);
  peer.on("error", onFehler);
  peer.on("connection", (verbindung: DataConnection) => {
    verbindung.on("data", (daten) => {
      if (!istAnfrage(daten)) return;
      const titel = pruefen(daten.id, daten.code);
      const antwort: Antwort = titel !== undefined ? { art: "ok", titel } : { art: "falsch" };
      verbindung.send(antwort);
    });
  });
  return { stoppen: () => peer.destroy() };
}

/** Käufer-Seite: schickt Nummer und Code an den Verkäufer und wartet auf die Antwort. */
export async function kaeuferSenden(peerId: string, id: string, code: string): Promise<Antwort | "keine-verbindung"> {
  const { Peer } = await import("peerjs");
  const peer: PeerTyp = new Peer();
  return new Promise((fertig) => {
    let erledigt = false;
    const ende = (r: Antwort | "keine-verbindung") => {
      if (erledigt) return;
      erledigt = true;
      clearTimeout(uhr);
      peer.destroy();
      fertig(r);
    };
    const uhr = setTimeout(() => ende("keine-verbindung"), WARTEZEIT_MS);
    peer.on("error", () => ende("keine-verbindung"));
    peer.on("open", () => {
      const verbindung = peer.connect(peerId, { reliable: true });
      verbindung.on("open", () => verbindung.send({ art: "uebergabe", id, code } satisfies Anfrage));
      verbindung.on("data", (d) => {
        const a = d as Antwort;
        if (a?.art === "ok" || a?.art === "falsch") ende(a);
      });
      verbindung.on("error", () => ende("keine-verbindung"));
    });
  });
}
