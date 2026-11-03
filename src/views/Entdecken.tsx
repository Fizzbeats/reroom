import { useMemo, useState } from "react";
import { ALLE_FARBEN, ALLE_STILE, type Moebel, type Raum, type Stil, type Zustand } from "../models/types";
import { findePassende } from "../logic/stilFinder";
import { pruefePasst, type Ampel } from "../logic/passtCheck";
import { alsCent, cashbackCent, euro } from "../logic/preisRechner";

interface Props {
  katalog: Moebel[];
  raum?: Raum;
  korb: string[];
  onKorb: (id: string) => void;
}

const AMPEL_TEXT: Record<Ampel, string> = { gruen: "Passt", gelb: "Knapp", rot: "Passt nicht" };

function umschalten<T>(liste: T[], wert: T): T[] {
  return liste.includes(wert) ? liste.filter((x) => x !== wert) : [...liste, wert];
}

export default function Entdecken({ katalog, raum, korb, onKorb }: Props) {
  const [budget, setBudget] = useState(1500);
  const [stile, setStile] = useState<Stil[]>([]);
  const [farben, setFarben] = useState<string[]>([]);
  const [zustand, setZustand] = useState<Zustand | "alle">("alle");

  const treffer = useMemo(
    () => findePassende(katalog, { budget, stile, farben }).filter((t) => zustand === "alle" || t.moebel.zustand === zustand),
    [katalog, budget, stile, farben, zustand],
  );

  return (
    <section>
      <h1>Entdecken</h1>
      <p className="gedaempft">{raum ? `Passt-Check für: ${raum.name}` : "Wähle auf der Startseite einen Raum für den Passt-Check."}</p>

      <div className="karte">
        <h2>Stil</h2>
        <div className="chips">
          {ALLE_STILE.map((s) => (
            <button key={s} className="chip" aria-pressed={stile.includes(s)} onClick={() => setStile(umschalten(stile, s))}>{s}</button>
          ))}
        </div>
        <h2>Farben</h2>
        <div className="chips">
          {ALLE_FARBEN.map((f) => (
            <button key={f} className="chip" aria-pressed={farben.includes(f)} onClick={() => setFarben(umschalten(farben, f))}>{f}</button>
          ))}
        </div>
        <label>
          <h2>Budget pro Möbel: {euro(alsCent(budget))}</h2>
          <input type="range" min={20} max={1500} step={10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
        </label>
        <label>
          Zustand
          <select value={zustand} onChange={(e) => setZustand(e.target.value as Zustand | "alle")}>
            <option value="alle">Neu und gebraucht</option>
            <option value="neu">Nur neu</option>
            <option value="gebraucht">Nur gebraucht</option>
          </select>
        </label>
      </div>

      <p>{treffer.length} Möbel gefunden</p>
      {treffer.map(({ moebel: m }) => {
        const passt = raum ? pruefePasst(m.masseCm, raum) : undefined;
        const imKorb = korb.includes(m.id);
        return (
          <article className="karte" key={m.id}>
            <div className="reihe">
              <strong>{m.name}</strong>
              <span className="badge">{m.zustand}</span>
            </div>
            <div className="gedaempft">
              {m.anbieter}
              {m.entfernungKm !== undefined && ` · ${m.entfernungKm} km`} · {m.masseCm.breite} × {m.masseCm.tiefe} × {m.masseCm.hoehe} cm
            </div>
            <p>{m.beschreibung}</p>
            <div className="reihe trenner">
              <strong className="preis-zahl">{euro(alsCent(m.preis))}</strong>
              {/* Werbesatz aus dem Businessplan: „800 €, mit ReRoom 768 €“ */}
              {m.zustand === "neu" && (
                <span className="cashback">mit ReRoom {euro(alsCent(m.preis) - cashbackCent(alsCent(m.preis)))}</span>
              )}
            </div>
            {passt && (
              <p className="trenner">
                <span className={`ampel ${passt.ampel}`}>{AMPEL_TEXT[passt.ampel]}</span>
                <br />
                <span className="gedaempft">{passt.begruendung}</span>
              </p>
            )}
            <button className={imKorb ? "" : "primaer"} onClick={() => onKorb(m.id)}>
              {imKorb ? "Aus dem Warenkorb nehmen" : "In den Warenkorb"}
            </button>
          </article>
        );
      })}
    </section>
  );
}
