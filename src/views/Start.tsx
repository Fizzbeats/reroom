import type { Moebel, Raum, Stil } from "../models/types";
import { BEISPIELRAEUME } from "../data/raeume";
import { findePassende } from "../logic/stilFinder";
import { pruefePasst } from "../logic/passtCheck";
import { Grundriss, Icon, ProduktKarte } from "./ui";

export const STIL_INFO: Record<Stil, { name: string; farbe: string }> = {
  skandi: { name: "Skandi", farbe: "#C9A06E" },
  modern: { name: "Modern", farbe: "#A3A7AB" },
  industrial: { name: "Industrial", farbe: "#2E2E2E" },
  boho: { name: "Boho", farbe: "#C9694C" },
  vintage: { name: "Vintage", farbe: "#80553A" },
};

interface Props {
  katalog: Moebel[];
  raeume: Raum[];
  raum?: Raum;
  stile: Stil[];
  onStile: (s: Stil[]) => void;
  onWaehlen: (id: string) => void;
  onOeffnen: (id: string) => void;
  onMessen: () => void;
  onEntdecken: () => void;
}

/** Startseite: der eigene Raum als Grundriss, dazu Stil und passende Möbel. */
export default function Start({ katalog, raeume, raum, stile, onStile, onWaehlen, onOeffnen, onMessen, onEntdecken }: Props) {
  const passend = raum
    ? findePassende(katalog, { budget: Infinity, stile, farben: [] })
        .map((t) => ({ ...t, passt: pruefePasst(t.moebel.masseCm, raum) }))
        .filter((t) => t.passt.ampel !== "rot")
        .slice(0, 4)
    : [];
  const alleRaeume = [...raeume, ...BEISPIELRAEUME];
  const flaeche = ((raum?.breiteCm ?? 0) * (raum?.tiefeCm ?? 0)) / 10000;

  return (
    <section>
      <div className="kopf">
        <p className="marke">ReRoom<i /></p>
      </div>

      {raum ? (
        <div className="raumkarte">
          <div className="zeile">
            <div>
              <small>Dein Raum</small>
              <h3>{raum.name}</h3>
            </div>
            <button className="chip" onClick={onMessen}><Icon name="kamera" groesse={16} /> Neu messen</button>
          </div>
          <Grundriss raum={raum} />
          <div className="werte">
            <div><b>{flaeche.toLocaleString("de-DE", { maximumFractionDigits: 1 })} m²</b>Fläche</div>
            <div><b>{raum.tuerBreiteCm} cm</b>Tür</div>
            <div><b>{raum.treppenhausBreiteCm} cm</b>Treppe</div>
          </div>
          {alleRaeume.length > 1 && (
            <div className="raumwahl" aria-label="Raum wechseln">
              {alleRaeume.map((r) => (
                <button key={r.id} className="chip" aria-pressed={r.id === raum.id} onClick={() => onWaehlen(r.id)}>{r.name}</button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="messen-cta">
          <h3>Passt das Sofa durch die Tür?</h3>
          <p>Miss deinen Raum mit der Handykamera. ReRoom zeigt dir dann nur Möbel, die wirklich passen.</p>
          <button className="knopf breit" onClick={onMessen}><Icon name="kamera" /> Raum ausmessen</button>
          <button className="link" style={{ color: "#C8C8C8" }} onClick={() => onWaehlen(BEISPIELRAEUME[2]!.id)}>
            Erst mit einem Beispielraum ausprobieren
          </button>
        </div>
      )}

      <h2>Dein Stil</h2>
      <div className="chips">
        {(Object.keys(STIL_INFO) as Stil[]).map((s) => (
          <button
            key={s}
            className="chip"
            aria-pressed={stile.includes(s)}
            onClick={() => onStile(stile.includes(s) ? stile.filter((x) => x !== s) : [...stile, s])}
          >
            <i className="punkt" style={{ background: STIL_INFO[s].farbe }} />{STIL_INFO[s].name}
          </button>
        ))}
      </div>

      {raum ? (
        <>
          <h2>Passt in dein {raum.name} <button className="link" onClick={onEntdecken}>Alle</button></h2>
          <div className="raster">
            {passend.map((t) => (
              <ProduktKarte key={t.moebel.id} moebel={t.moebel} ampel={t.passt.ampel} onOeffnen={() => onOeffnen(t.moebel.id)} />
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>Für deinen Stil <button className="link" onClick={onEntdecken}>Alle</button></h2>
          <div className="raster">
            {findePassende(katalog, { budget: Infinity, stile, farben: [] }).slice(0, 4).map((t) => (
              <ProduktKarte key={t.moebel.id} moebel={t.moebel} onOeffnen={() => onOeffnen(t.moebel.id)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
