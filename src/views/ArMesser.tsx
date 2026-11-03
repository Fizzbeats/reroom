import { useEffect, useRef, useState } from "react";
import type { Ziel } from "./KameraMesser";
import { abstandCm, hoeheCm, raumAusEcken, type Punkt3D } from "../logic/arMessung";
import { ArSitzung } from "../services/arSitzung";

export type Werte = Partial<Record<Ziel, number>>;

interface Schritt {
  titel: string;
  anleitung: string;
  punkte: number;
  rechne: (p: Punkt3D[]) => Werte;
}

// Reihenfolge so, dass man einmal durch den Raum geht und am Ende ins Treppenhaus
const SCHRITTE: Schritt[] = [
  {
    titel: "Raumecken",
    anleitung: "Richte die Kamera auf den Boden, bis der Ring erscheint. Tippe dann nacheinander die 4 Ecken des Raums an, einmal im Kreis.",
    punkte: 4,
    rechne: (p) => {
      const r = raumAusEcken(p);
      return r ? { breite: r.breiteCm, tiefe: r.tiefeCm } : {};
    },
  },
  {
    titel: "Raumhöhe",
    anleitung: "Tippe unten an eine Wand, direkt über dem Boden. Dann tippe ganz oben an dieselbe Wand, direkt unter der Decke.",
    punkte: 2,
    rechne: (p) => ({ hoehe: hoeheCm(p[0]!, p[1]!) }),
  },
  {
    titel: "Türbreite",
    anleitung: "Tippe unten links und unten rechts innen in den Türrahmen.",
    punkte: 2,
    rechne: (p) => ({ tuerB: abstandCm(p[0]!, p[1]!) }),
  },
  {
    titel: "Türhöhe",
    anleitung: "Tippe unten in den Türrahmen und dann ganz oben in den Türrahmen.",
    punkte: 2,
    rechne: (p) => ({ tuerH: hoeheCm(p[0]!, p[1]!) }),
  },
  {
    titel: "Treppenhaus",
    anleitung: "Geh ins Treppenhaus zur engsten Stelle. Tippe links und rechts an die Wand oder ans Geländer.",
    punkte: 2,
    rechne: (p) => ({ treppe: abstandCm(p[0]!, p[1]!) }),
  },
];

const NAMEN: Record<Ziel, string> = {
  breite: "Breite", tiefe: "Tiefe", hoehe: "Höhe", tuerB: "Türbreite", tuerH: "Türhöhe", treppe: "Treppenhaus",
};

/** Geführte Messung mit der AR-Kamera: kein Zollstock nötig. */
export default function ArMesser({ onFertig }: { onFertig: (werte: Werte) => void }) {
  const overlay = useRef<HTMLDivElement>(null);
  const sitzung = useRef<ArSitzung | null>(null);
  const punkte = useRef<Punkt3D[]>([]);
  const schrittRef = useRef(0);
  const [aktiv, setAktiv] = useState(false);
  const [schritt, setSchritt] = useState(0);
  const [anzahl, setAnzahl] = useState(0);
  const [ergebnis, setErgebnis] = useState<Werte>();
  const [werte, setWerte] = useState<Werte>({});
  const [fehler, setFehler] = useState("");

  // Tippen auf Knöpfe im Overlay soll keinen Messpunkt setzen
  useEffect(() => {
    const el = overlay.current;
    const sperren = (e: Event) => {
      if ((e.target as HTMLElement).closest("button")) e.preventDefault();
    };
    el?.addEventListener("beforexrselect", sperren);
    return () => el?.removeEventListener("beforexrselect", sperren);
  }, []);

  useEffect(() => () => sitzung.current?.beenden(), []);

  function schrittStarten(i: number) {
    schrittRef.current = i;
    punkte.current = [];
    sitzung.current?.markierungenLeeren();
    setSchritt(i);
    setAnzahl(0);
    setErgebnis(undefined);
  }

  async function starten() {
    setFehler("");
    const s = new ArSitzung();
    s.onPunkt = (p) => {
      const ziel = SCHRITTE[schrittRef.current]!;
      if (punkte.current.length >= ziel.punkte) return;
      punkte.current = [...punkte.current, p];
      setAnzahl(punkte.current.length);
      if (punkte.current.length === ziel.punkte) setErgebnis(ziel.rechne(punkte.current));
    };
    s.onEnde = () => setAktiv(false);
    sitzung.current = s;
    schrittStarten(0);
    setWerte({});
    try {
      setAktiv(true);
      await s.starten(overlay.current!);
    } catch (e) {
      setAktiv(false);
      setFehler(e instanceof Error ? `Die Kamera konnte nicht starten: ${e.message}` : "Die Kamera konnte nicht starten.");
    }
  }

  function weiter(uebernehmen: boolean) {
    const neu = uebernehmen && ergebnis ? { ...werte, ...ergebnis } : werte;
    setWerte(neu);
    if (schritt + 1 < SCHRITTE.length) {
      schrittStarten(schritt + 1);
    } else {
      sitzung.current?.beenden();
      onFertig(neu);
    }
  }

  const s = SCHRITTE[schritt]!;

  return (
    <>
      <div className="karte">
        <h2>Raum mit der Kamera messen</h2>
        <p className="gedaempft">Du gehst einmal durch den Raum und tippst Ecken, Tür und Treppenhaus an. Einen Zollstock brauchst du nicht.</p>
        <button className="primaer" onClick={starten}>Kamera starten</button>
        {fehler && <p role="alert" className="hinweis">{fehler}</p>}
      </div>

      {/* Wird während der AR-Sitzung über das Kamerabild gelegt */}
      <div ref={overlay} className="ar-overlay" hidden={!aktiv}>
        <div className="ar-panel">
          <div className="ar-kopf">
            <span className="gedaempft">Schritt {schritt + 1} von {SCHRITTE.length}</span>
            <button className="ar-schliessen" onClick={() => sitzung.current?.beenden()} aria-label="Messung abbrechen">✕</button>
          </div>
          <strong>{s.titel}</strong>
          <p>{s.anleitung}</p>
          {!ergebnis && <p className="gedaempft">{anzahl} von {s.punkte} Punkten gesetzt</p>}
          {ergebnis && (
            <p className="ar-ergebnis">
              {Object.entries(ergebnis).map(([k, v]) => `${NAMEN[k as Ziel]}: ${v} cm`).join(" · ")}
            </p>
          )}
          <div className="reihe">
            {ergebnis ? (
              <>
                <button onClick={() => schrittStarten(schritt)}>Nochmal</button>
                <button className="primaer" onClick={() => weiter(true)}>{schritt + 1 < SCHRITTE.length ? "Weiter" : "Fertig"}</button>
              </>
            ) : (
              <>
                {anzahl > 0 && <button onClick={() => schrittStarten(schritt)}>Neu setzen</button>}
                <button onClick={() => weiter(false)}>Überspringen</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
