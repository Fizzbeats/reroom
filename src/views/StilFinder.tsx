import { useEffect, useMemo, useRef, useState } from "react";
import type { Moebel, Raum } from "../models/types";
import { INSPO_KARTEN } from "../data/inspo";
import type { InspoKarte } from "../logic/stilAuswertung";
import { bildVerkleinern, farbenAusBild } from "../services/foto";
import FotoAufnahme from "./FotoAufnahme";
import { werteAus, zimmerSet, type StilErgebnis } from "../logic/stilAuswertung";
import { pruefeMoebel } from "../logic/passtCheck";
import { cashbackProzent } from "../logic/aktion";
import { alsCent, berechneWarenkorb, euro } from "../logic/preisRechner";
import { Moodboard } from "./Moodboard";
import { STIL_INFO } from "./Start";
import type { Stil } from "../models/types";
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
  // Eigene Inspo-Bilder: Farben liest ReRoom aus dem Bild, den Stil wählt der Nutzer selbst
  const [eigene, setEigene] = useState<InspoKarte[]>([]);
  const [kameraOffen, setKameraOffen] = useState(false);
  const [entwurf, setEntwurf] = useState<{ bildUrl: string; farben: string[] }>();
  const [bildFehler, setBildFehler] = useState("");

  async function bildAnnehmen(datei: File) {
    try {
      const bildUrl = await bildVerkleinern(datei, 700, 0.7);
      setEntwurf({ bildUrl, farben: await farbenAusBild(bildUrl) });
      setBildFehler("");
    } catch (e) {
      setBildFehler(e instanceof Error ? e.message : "Das Bild konnte nicht gelesen werden.");
    }
    setKameraOffen(false);
  }
  const stilWaehlen = (stil: Stil) => {
    if (!entwurf) return;
    setEigene((a) => [...a, { id: `eigen-${a.length}`, stil, farben: entwurf.farben, bildUrl: entwurf.bildUrl }]);
    setEntwurf(undefined);
  };
  const eigenesBildKnopf = (
    <button className="knopf leise breit" style={{ marginTop: 12 }} onClick={() => setKameraOffen(true)}>
      <Icon name="kamera" groesse={18} /> Eigenes Inspirationsbild hinzufügen
    </button>
  );
  const eigeneUeberlagerungen = (
    <>
      {kameraOffen && <FotoAufnahme rahmen="bild" titel="Inspirationsbild" onFoto={bildAnnehmen} onSchliessen={() => setKameraOffen(false)} />}
      {entwurf && (
        <div className="vollbild" role="dialog" aria-modal="true" aria-label="Stil deines Bildes">
          <div className="vollbild-innen">
            <h1 style={{ margin: "0 0 12px" }}>Welcher Stil ist das?</h1>
            <img src={entwurf.bildUrl} alt="Dein Inspirationsbild" style={{ width: "100%", maxHeight: "45vh", objectFit: "cover", borderRadius: 18 }} />
            <p className="gedaempft">
              {entwurf.farben.length > 0 ? `ReRoom erkennt diese Farben: ${entwurf.farben.join(", ")}.` : "Farben konnte ReRoom hier nicht erkennen."} Den Stil wählst du selbst.
            </p>
            <div className="chips" style={{ padding: 0, flexWrap: "wrap" }}>
              {(Object.keys(STIL_INFO) as Stil[]).map((st) => <button key={st} className="chip" onClick={() => stilWaehlen(st)}>{STIL_INFO[st].name}</button>)}
            </div>
            <button className="link" onClick={() => setEntwurf(undefined)}>Verwerfen</button>
          </div>
        </div>
      )}
    </>
  );

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

  const ergebnis = useMemo(() => werteAus([...INSPO_KARTEN, ...eigene], [...antworten, ...eigene.map(() => true)]), [antworten, eigene]);
  const set = useMemo(() => zimmerSet(katalog, ergebnis, budget, raum), [katalog, ergebnis, budget, raum]);
  const korb = berechneWarenkorb(set.moebel, cashbackProzent());

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
          {eigenesBildKnopf}
          {bildFehler && <p className="hinweis" role="alert">{bildFehler}</p>}
          {eigene.length > 0 && <p className="gedaempft" style={{ textAlign: "center" }}>{eigene.length} eigene{eigene.length === 1 ? "s Bild" : " Bilder"} zählt als „gefällt mir“.</p>}
          {eigeneUeberlagerungen}
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

        {eigene.length > 0 && (
          <div className="chips" style={{ margin: "12px 0 0", padding: 0 }}>
            {eigene.map((k) => <img key={k.id} src={k.bildUrl} alt="" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 12 }} />)}
          </div>
        )}
        {eigenesBildKnopf}
        {eigeneUeberlagerungen}

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
