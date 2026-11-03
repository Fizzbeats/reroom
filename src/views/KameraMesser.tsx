import { useEffect, useRef, useState } from "react";
import { abstandPx, messHinweis, messeCm, REFERENZEN, skalierung, type Punkt } from "../logic/messen";

export type Ziel = "breite" | "tiefe" | "hoehe" | "tuerB" | "tuerH" | "treppe";

const ZIELE: { id: Ziel; name: string }[] = [
  { id: "tuerB", name: "Türbreite" },
  { id: "tuerH", name: "Türhöhe" },
  { id: "treppe", name: "Treppenhausbreite" },
  { id: "breite", name: "Raumbreite" },
  { id: "tiefe", name: "Raumtiefe" },
  { id: "hoehe", name: "Raumhöhe" },
];

interface Props {
  onWert: (ziel: Ziel, cm: number) => void;
}

/** Foto mit der Kamera aufnehmen, Referenzobjekt antippen, dann beliebige Strecken messen. */
export default function KameraMesser({ onWert }: Props) {
  const [bild, setBild] = useState<HTMLImageElement>();
  const [referenzId, setReferenzId] = useState(REFERENZEN[0]!.id);
  const [ziel, setZiel] = useState<Ziel>("tuerB");
  const [refPunkte, setRefPunkte] = useState<Punkt[]>([]);
  const [messPunkte, setMessPunkte] = useState<Punkt[]>([]);
  const [meldung, setMeldung] = useState("");
  const leinwand = useRef<HTMLCanvasElement>(null);

  const referenz = REFERENZEN.find((r) => r.id === referenzId)!;
  const cmProPx = refPunkte.length === 2 ? skalierung(referenz.laengeCm, refPunkte[0]!, refPunkte[1]!) : undefined;
  const schritt = !bild ? 0 : refPunkte.length < 2 ? 1 : 2;

  // Foto, Punkte und Linien zeichnen
  useEffect(() => {
    const c = leinwand.current;
    if (!c || !bild) return;
    c.width = bild.naturalWidth;
    c.height = bild.naturalHeight;
    const g = c.getContext("2d")!;
    g.drawImage(bild, 0, 0);
    const linie = (p: Punkt[], farbe: string) => {
      g.strokeStyle = farbe;
      g.fillStyle = farbe;
      g.lineWidth = Math.max(3, c.width / 250);
      if (p.length === 2) {
        g.beginPath();
        g.moveTo(p[0]!.x, p[0]!.y);
        g.lineTo(p[1]!.x, p[1]!.y);
        g.stroke();
      }
      for (const q of p) {
        g.beginPath();
        g.arc(q.x, q.y, g.lineWidth * 2, 0, Math.PI * 2);
        g.fill();
      }
    };
    linie(refPunkte, "#E07A5F");
    linie(messPunkte, "#2F6B5E");
  }, [bild, refPunkte, messPunkte]);

  function fotoWaehlen(datei: File | undefined) {
    if (!datei) return;
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = () => {
      setBild(img);
      setRefPunkte([]);
      setMessPunkte([]);
      setMeldung("");
    };
    img.src = url;
  }

  function antippen(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = leinwand.current;
    if (!c || !bild || schritt === 0) return;
    const r = c.getBoundingClientRect();
    const p = { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
    if (schritt === 1) {
      const neu = [...refPunkte, p];
      setRefPunkte(neu);
      if (neu.length === 2) setMeldung(messHinweis(abstandPx(neu[0]!, neu[1]!), c.width) ?? "");
      return;
    }
    setMessPunkte(messPunkte.length >= 2 ? [p] : [...messPunkte, p]);
  }

  const gemessen = cmProPx && messPunkte.length === 2 ? messeCm(messPunkte[0]!, messPunkte[1]!, cmProPx) : undefined;

  return (
    <div className="flaeche">
      <h2>Mit der Kamera messen</h2>
      <p className="gedaempft">
        Lege eine Bankkarte oder ein A4-Blatt flach an das, was du messen willst (Tür, Wand). Fotografiere gerade von vorn.
        Zum Beispiel: Karte an die Tür halten und die ganze Tür aufnehmen.
      </p>
      <label>
        Referenzobjekt
        <select value={referenzId} onChange={(e) => { setReferenzId(e.target.value); setRefPunkte([]); setMessPunkte([]); }}>
          {REFERENZEN.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>
      {/* capture öffnet auf dem Handy direkt die Kamera, am PC die Dateiauswahl */}
      <label>
        Foto aufnehmen
        <input type="file" accept="image/*" capture="environment" onChange={(e) => fotoWaehlen(e.target.files?.[0])} />
      </label>

      {bild && (
        <>
          <p role="status">
            {schritt === 1 && `Schritt 1: Tippe die zwei Enden des Referenzobjekts an (${refPunkte.length}/2).`}
            {schritt === 2 && "Schritt 2: Tippe Anfang und Ende der Strecke an, die du messen willst."}
          </p>
          {meldung && <p role="alert" className="hinweis">{meldung}</p>}
          <canvas
            ref={leinwand}
            onPointerDown={antippen}
            aria-label="Foto zum Ausmessen"
            style={{ width: "100%", height: "auto", touchAction: "manipulation", borderRadius: 12 }}
          />
          {schritt === 2 && (
            <>
              <label>
                Das ist
                <select value={ziel} onChange={(e) => setZiel(e.target.value as Ziel)}>
                  {ZIELE.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </label>
              <p>{gemessen !== undefined ? <strong>Gemessen: {gemessen} cm</strong> : <span className="gedaempft">Noch keine Strecke gesetzt.</span>}</p>
              <div className="reihe">
                <button className="knopf" disabled={gemessen === undefined} onClick={() => gemessen !== undefined && onWert(ziel, gemessen)}>
                  Wert übernehmen
                </button>
                <button className="knopf leise" onClick={() => { setRefPunkte([]); setMessPunkte([]); }}>Neu ansetzen</button>
              </div>
              <p className="gedaempft">Die Messung ist eine Schätzung (etwa ±3 %). Bitte nachmessen, wenn es knapp wird.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
