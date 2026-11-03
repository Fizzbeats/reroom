import { useEffect, useMemo, useRef, useState } from "react";
import type { Moebel, Raum } from "../models/types";
import { INSPO_KARTEN } from "../data/inspo";
import { werteAus, zimmerSet, type StilErgebnis } from "../logic/stilAuswertung";
import { pruefeMoebel } from "../logic/passtCheck";
import { alsCent, berechneWarenkorb, euro } from "../logic/preisRechner";
import { Moodboard } from "./Moodboard";
import { STIL_INFO } from "./Start";
import { AMPEL_TEXT, FARBE, Icon, MoebelBild, kurzInfo } from "./ui";

interface Props {
  katalog: Moebel[];
  raum?: Raum;
  onFertig: (ergebnis: StilErgebnis, setIds: string[]) => void;
  onSchliessen: () => void;
}

const WISCH_SCHWELLE_PX = 90;

/** Stil-Finder: durch Inspo-Karten wischen, Budget fürs Zimmer wählen, fertiges Set bekommen. */
export default function StilFinder({ katalog, raum, onFertig, onSchliessen }: Props) {
  const [antworten, setAntworten] = useState<boolean[]>([]);
  const [budget, setBudget] = useState(300);
  const [zug, setZug] = useState(0); // horizontale Verschiebung beim Wischen
  const start = useRef<number | null>(null);

  const index = antworten.length;
  const fertig = index >= INSPO_KARTEN.length;
  const karte = INSPO_KARTEN[index];

  const antworte = (gefaellt: boolean) => {
    setZug(0);
    setAntworten((a) => [...a, gefaellt]);
  };

  useEffect(() => {
    const tasten = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSchliessen();
      if (!fertig && e.key === "ArrowLeft") antworte(false);
      if (!fertig && e.key === "ArrowRight") antworte(true);
    };
    addEventListener("keydown", tasten);
    return () => removeEventListener("keydown", tasten);
  }, [fertig, onSchliessen]);

  const ergebnis = useMemo(() => werteAus(INSPO_KARTEN, antworten), [antworten]);
  const set = useMemo(() => zimmerSet(katalog, ergebnis, budget, raum), [katalog, ergebnis, budget, raum]);
  const korb = berechneWarenkorb(set.moebel);

  if (!fertig && karte) {
    return (
      <div className="vollbild" role="dialog" aria-modal="true" aria-label="Stil-Finder">
        <div className="vollbild-innen">
          <div className="reihe">
            <span className="gedaempft">Bild {index + 1} von {INSPO_KARTEN.length}</span>
            <button className="link" onClick={() => setAntworten(INSPO_KARTEN.map((_, i) => antworten[i] ?? false))}>Überspringen</button>
          </div>
          <div className="fortschritt"><i style={{ width: `${(index / INSPO_KARTEN.length) * 100}%` }} /></div>
          <h1 style={{ margin: "18px 0 16px" }}>Gefällt dir das?</h1>

          <div className="wisch-stapel">
            <div className="wisch-hinten" />
            <div
              className="wisch-karte"
              style={{ transform: `translateX(${zug}px) rotate(${zug / 18 - 2}deg)`, transition: start.current === null ? "transform .25s" : "none" }}
              onPointerDown={(e) => { start.current = e.clientX; (e.target as Element).setPointerCapture?.(e.pointerId); }}
              onPointerMove={(e) => { if (start.current !== null) setZug(e.clientX - start.current); }}
              onPointerUp={() => {
                start.current = null;
                if (zug > WISCH_SCHWELLE_PX) antworte(true);
                else if (zug < -WISCH_SCHWELLE_PX) antworte(false);
                else setZug(0);
              }}
            >
              <Moodboard karte={karte} />
              {zug > 30 && <span className="wisch-stempel ja">Gefällt mir</span>}
              {zug < -30 && <span className="wisch-stempel nein">Nicht mein Stil</span>}
            </div>
          </div>

          <div className="wisch-knoepfe">
            <button className="wisch-nein" onClick={() => antworte(false)} aria-label="Gefällt mir nicht"><Icon name="schliessen" groesse={28} /></button>
            <button className="wisch-ja" onClick={() => antworte(true)} aria-label="Gefällt mir"><Icon name="herz" groesse={28} gefuellt /></button>
          </div>
          <p className="gedaempft" style={{ textAlign: "center" }}>Nach links wischen: nicht mein Stil · nach rechts: gefällt mir</p>
        </div>
      </div>
    );
  }

  const [s1, s2] = ergebnis.stile;
  return (
    <div className="vollbild" role="dialog" aria-modal="true" aria-label="Dein Stil">
      <div className="vollbild-innen">
        <div className="reihe">
          <span className="gedaempft">Dein Ergebnis</span>
          <button className="rund" onClick={onSchliessen} aria-label="Schließen"><Icon name="schliessen" groesse={18} /></button>
        </div>
        <h1 className="ergebnis-titel">
          {s1 ? <>Du magst <em>{STIL_INFO[s1].name}</em>{s2 && <><br />mit etwas {STIL_INFO[s2].name}</>}</> : "Noch kein Favorit dabei"}
        </h1>
        {ergebnis.farben.length > 0 && (
          <div className="chips" style={{ margin: "12px 0 0", padding: 0 }}>
            {ergebnis.farben.map((f) => <span key={f} className="chip"><i className="punkt" style={{ background: FARBE[f] }} />{f}</span>)}
          </div>
        )}

        <div className="flaeche">
          <label style={{ margin: 0 }}>
            <span className="reihe"><span>Budget fürs ganze Zimmer</span><b className="preis-gross" style={{ fontSize: "1.15rem" }}>{euro(alsCent(budget))}</b></span>
            <input type="range" min={100} max={2000} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </label>
        </div>

        <h2>Dein Set{raum ? ` fürs ${raum.name}` : ""} <small className="gedaempft">{set.moebel.length} Möbel</small></h2>
        {set.moebel.length === 0 && <p className="gedaempft">Für dieses Budget finden wir noch nichts Passendes. Schieb den Regler etwas weiter.</p>}
        {set.moebel.map((m) => {
          const passt = raum ? pruefeMoebel(m, raum) : undefined;
          return (
            <div className="position" key={m.id}>
              <span className="mini"><MoebelBild moebel={m} /></span>
              <div className="info">
                <strong>{m.name}</strong>
                <span>{kurzInfo(m)}{passt && ` · ${AMPEL_TEXT[passt.ampel]}`}</span>
              </div>
              <b>{euro(alsCent(m.preis))}</b>
            </div>
          );
        })}
      </div>

      <div className="kaufleiste">
        <div>
          <div className="preisblock">
            <span className="preis-gross">{euro(korb.zwischensummeCent)}</span>
            {korb.cashbackCent > 0 && <span className="mit-reroom">{euro(korb.cashbackCent)} zurück</span>}
          </div>
          <button className="knopf" disabled={set.moebel.length === 0} onClick={() => onFertig(ergebnis, set.moebel.map((m) => m.id))}>
            Alles in den Korb
          </button>
        </div>
      </div>
    </div>
  );
}
